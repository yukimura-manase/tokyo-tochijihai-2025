"""Evacuation RAG system for location-aware evacuation area search."""

from typing import List, Dict, Any, Optional
from pathlib import Path

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel

from core.rag.base import BaseRAG, BaseHybridRetriever
from core.data.loaders.csv_loader import load_csv_as_documents
from core.data.processors.geo_utils import rerank_by_distance, filter_by_radius
from config import Settings
from utils import extract_llm_response_text


class GeoHybridRetriever(BaseHybridRetriever):
    """
    Hybrid retriever combining semantic search with geographic filtering and ranking.
    """
    
    def retrieve(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        k_final: int = 10,
        filter_barrier_free: bool = False,
        filter_hazard: Optional[str] = None
    ) -> List[Document]:
        """
        Retrieve documents using semantic search and geographic ranking.
        
        Args:
            query: Search query
            user_lat: User's latitude
            user_lon: User's longitude
            municipality: Filter by municipality name
            k_final: Number of final results to return
            filter_barrier_free: Only return barrier-free facilities
            filter_hazard: Filter by specific hazard type
        
        Returns:
            List of relevant documents
        """
        # Build metadata filter
        where = {}
        if municipality:
            where["municipality"] = {"$eq": municipality}
        if filter_barrier_free:
            where["is_barrier_free"] = {"$eq": True}
        if filter_hazard:
            where[f"supports_{filter_hazard}"] = {"$eq": True}
        
        # Semantic search
        sem_docs = self.vectorstore.similarity_search(
            query=query,
            k=self.k_semantic,
            filter=where if where else None
        )
        
        # If no location provided, return semantic results
        if user_lat is None or user_lon is None:
            return sem_docs[:k_final]
        
        # Rerank by distance
        ranked_docs = rerank_by_distance(sem_docs, user_lat, user_lon)
        docs_with_distance = [doc for _, doc in ranked_docs]
        
        # Add distance to metadata
        for dist, doc in ranked_docs:
            doc.metadata["distance_km"] = round(dist, 3)
        
        # Apply radius filter if specified
        if self.radius_km is not None:
            docs_with_distance = filter_by_radius(
                docs_with_distance, user_lat, user_lon, self.radius_km
            )
            
            # If radius filter leaves too few results, add some from original
            if len(docs_with_distance) < k_final:
                remaining = k_final - len(docs_with_distance)
                additional = [d for d in sem_docs if d not in docs_with_distance][:remaining]
                docs_with_distance.extend(additional)
        
        return docs_with_distance[:k_final]


class EvacuationRAG(BaseRAG):
    """
    RAG system for evacuation area search with location awareness.
    """
    
    def __init__(self, settings: Settings):
        self.csv_path = settings.EVAC_CSV_PATH
        
        super().__init__(
            persist_dir=settings.EVAC_PERSIST_DIR,
            settings=settings,
            collection_name="evac_areas"
        )
        
        # Initialize or load vector store
        self.vectorstore = self._initialize_vectorstore()
        
        # Initialize retriever
        self._initialize_retriever()
        
        # Build RAG chain
        self.chain = self._build_chain()
    
    def _load_documents(self) -> List[Document]:
        """Load evacuation area documents from CSV."""
        return load_csv_as_documents(self.csv_path)
    
    def _initialize_vectorstore(self):
        """Initialize or load the vector store."""
        # Try to load existing vector store
        vectorstore = self._load_existing_vectorstore()
        if vectorstore:
            return vectorstore
        
        # Create new vector store
        print(f"Creating new vector store from {self.csv_path}")
        docs = self._load_documents()
        return self._create_vectorstore(docs)
    
    def _initialize_retriever(self):
        """Initialize the geo-hybrid retriever."""
        self.retriever = GeoHybridRetriever(
            vectorstore=self.vectorstore,
            k_semantic=self.settings.DEFAULT_K_SEMANTIC,
            radius_km=self.settings.DEFAULT_RADIUS_KM
        )
    
    def _format_context_with_distance(
        self, 
        docs: List[Document], 
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> str:
        """Format documents with distance information for the prompt."""
        lines = []
        
        for i, doc in enumerate(docs, 1):
            distance = doc.metadata.get("distance_km", None)
            
            parts = [
                f"{i}. 施設名: {doc.metadata.get('facility', '不明')}",
                f"   住所: {doc.metadata.get('address', '不明')}",
                f"   自治体: {doc.metadata.get('municipality', '不明')}",
            ]
            
            if distance is not None:
                parts.append(f"   距離: {distance} km")
            
            phone = doc.metadata.get('phone', '')
            if phone:
                parts.append(f"   電話: {phone}")
            
            if doc.metadata.get('is_barrier_free', False):
                parts.append("   バリアフリー: ○")
            
            hazards = doc.metadata.get('hazards', "")
            if hazards:
                parts.append(f"   対応災害: {hazards}")
            
            lines.extend(parts)
            lines.append("")  # Empty line between entries
        
        return "\n".join(lines)
    
    def _build_chain(self):
        """Build the RAG chain using LCEL."""
        # Prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "あなたは防災支援アシスタントです。ユーザーの質問に対し、"
             "以下の『避難所情報』だけを根拠に、正確で有用な情報を提供してください。"
             "距離が近い順に並んでいる場合は、その順序を考慮して回答してください。"
             "情報が不足している場合は、正直にその旨を伝えてください。"),
            ("human", "質問: {question}\n\n避難所情報:\n{context}")
        ])
        
        # Retrieval function
        def retrieve_fn(inputs: Dict[str, Any]) -> List[Document]:
            return self.retriever.retrieve(
                query=inputs["question"],
                user_lat=inputs.get("user_lat"),
                user_lon=inputs.get("user_lon"),
                municipality=inputs.get("municipality"),
                k_final=inputs.get("k_results", self.settings.DEFAULT_K_RESULTS),
                filter_barrier_free=inputs.get("filter_barrier_free", False),
                filter_hazard=inputs.get("filter_hazard")
            )
        
        retrieve = RunnableLambda(retrieve_fn)
        
        # Context formatting
        to_prompt = RunnableLambda(
            lambda x: {
                "question": x["question"],
                "context": self._format_context_with_distance(
                    x["docs"], 
                    x.get("user_lat"), 
                    x.get("user_lon")
                )
            }
        )
        
        # Build chain
        chain = (
            RunnableParallel({
                "docs": retrieve,
                "question": lambda x: x["question"],
                "user_lat": lambda x: x.get("user_lat"),
                "user_lon": lambda x: x.get("user_lon")
            })
            | to_prompt
            | prompt
            | self.llm
        )
        
        return chain
    
    def search(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        k_results: int = 8,
        filter_barrier_free: bool = False,
        filter_hazard: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for evacuation areas based on query and location.
        
        Args:
            query: Search query
            user_lat: User's latitude
            user_lon: User's longitude
            municipality: Filter by municipality
            k_results: Number of results to consider
            filter_barrier_free: Only return barrier-free facilities
            filter_hazard: Filter by specific hazard type
        
        Returns:
            Dictionary with answer and source documents
        """
        # Prepare inputs
        inputs = {
            "question": query,
            "user_lat": user_lat,
            "user_lon": user_lon,
            "municipality": municipality,
            "k_results": k_results,
            "filter_barrier_free": filter_barrier_free,
            "filter_hazard": filter_hazard
        }
        
        # Get documents for metadata
        docs = self.retriever.retrieve(
            query=query,
            user_lat=user_lat,
            user_lon=user_lon,
            municipality=municipality,
            k_final=k_results,
            filter_barrier_free=filter_barrier_free,
            filter_hazard=filter_hazard
        )
        
        # Get answer from chain
        answer = self.chain.invoke(inputs)
        answer_text = extract_llm_response_text(answer)
        
        # Prepare source documents
        sources = []
        for doc in docs:
            source = {
                "facility": doc.metadata.get("facility"),
                "address": doc.metadata.get("address"),
                "municipality": doc.metadata.get("municipality"),
                "lat": doc.metadata.get("lat"),
                "lon": doc.metadata.get("lon"),
                "distance_km": doc.metadata.get("distance_km"),
                "phone": doc.metadata.get("phone"),
                "is_barrier_free": doc.metadata.get("is_barrier_free"),
                "hazards": doc.metadata.get("hazards", "")
            }
            sources.append(source)
        
        return {
            "answer": answer_text,
            "sources": sources,
            "total_results": len(docs)
        }