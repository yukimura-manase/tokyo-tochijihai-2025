"""WiFi RAG system for location-aware WiFi spot search."""

from typing import List, Dict, Any, Optional

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel

from core.rag.base import BaseRAG, BaseHybridRetriever
from core.data.loaders.excel_loader import load_wifi_excel_as_documents
from core.data.processors.geo_utils import rerank_by_distance, filter_by_radius
from config import Settings
from utils import extract_llm_response_text


class WiFiHybridRetriever(BaseHybridRetriever):
    """
    Hybrid retriever combining semantic search with geographic filtering and ranking for WiFi spots.
    """
    
    def retrieve(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        k_final: int = 10,
        filter_free_only: bool = False,
        filter_24h_only: bool = False,
        provider: Optional[str] = None
    ) -> List[Document]:
        """
        Retrieve WiFi spot documents using semantic search and geographic ranking.
        
        Args:
            query: Search query
            user_lat: User's latitude
            user_lon: User's longitude
            municipality: Filter by municipality name
            k_final: Number of final results to return
            filter_free_only: Only return free WiFi spots
            filter_24h_only: Only return 24-hour available WiFi spots
            provider: Filter by specific provider
        
        Returns:
            List of relevant documents
        """
        # Build metadata filter
        where = {}
        if municipality:
            where["municipality"] = {"$eq": municipality}
        if filter_free_only:
            where["is_free"] = {"$eq": True}
        if filter_24h_only:
            where["is_24h"] = {"$eq": True}
        if provider:
            where["provider"] = {"$eq": provider}
        
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


class WiFiRAG(BaseRAG):
    """
    RAG system for WiFi spot search with location awareness.
    """
    
    def __init__(self, settings: Settings):
        self.excel_path = settings.WIFI_EXCEL_PATH
        
        super().__init__(
            persist_dir=settings.WIFI_PERSIST_DIR,
            settings=settings,
            collection_name="wifi_spots"
        )
        
        # Initialize or load vector store
        self.vectorstore = self._initialize_vectorstore()
        
        # Initialize retriever
        self._initialize_retriever()
        
        # Build RAG chain
        self.chain = self._build_chain()
    
    def _load_documents(self) -> List[Document]:
        """Load WiFi spot documents from Excel."""
        docs = load_wifi_excel_as_documents(self.excel_path)
        if not docs:
            raise ValueError(f"No WiFi documents loaded from {self.excel_path}")
        return docs
    
    def _initialize_vectorstore(self):
        """Initialize or load the vector store."""
        # Try to load existing vector store
        vectorstore = self._load_existing_vectorstore()
        if vectorstore:
            return vectorstore
        
        # Create new vector store
        print(f"Creating new WiFi vector store from {self.excel_path}")
        docs = self._load_documents()
        return self._create_vectorstore(docs)
    
    def _initialize_retriever(self):
        """Initialize the WiFi hybrid retriever."""
        self.retriever = WiFiHybridRetriever(
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
                f"{i}. 施設名: {doc.metadata.get('facility_name', '不明')}",
                f"   住所: {doc.metadata.get('address', '不明')}",
                f"   自治体: {doc.metadata.get('municipality', '不明')}",
            ]
            
            if distance is not None:
                parts.append(f"   距離: {distance} km")
            
            provider = doc.metadata.get('provider', '')
            if provider:
                parts.append(f"   事業者: {provider}")
            
            ssid = doc.metadata.get('ssid', '')
            if ssid:
                parts.append(f"   SSID: {ssid}")
            
            available_hours = doc.metadata.get('available_hours', '')
            if available_hours:
                parts.append(f"   利用時間: {available_hours}")
            
            fee = doc.metadata.get('fee', '')
            if fee:
                parts.append(f"   料金: {fee}")
            
            if doc.metadata.get('is_free', False):
                parts.append("   無料WiFi: ○")
            
            if doc.metadata.get('is_24h', False):
                parts.append("   24時間利用: ○")
            
            auth_method = doc.metadata.get('auth_method', '')
            if auth_method:
                parts.append(f"   認証: {auth_method}")
            
            phone = doc.metadata.get('phone', '')
            if phone:
                parts.append(f"   電話: {phone}")
            
            url = doc.metadata.get('url', '')
            if url:
                parts.append(f"   URL: {url}")
            
            notes = doc.metadata.get('notes', '')
            if notes:
                parts.append(f"   備考: {notes}")
            
            lines.extend(parts)
            lines.append("")  # Empty line between entries
        
        return "\n".join(lines)
    
    def _build_chain(self):
        """Build the RAG chain using LCEL."""
        # Prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "あなたは東京都内のWiFiスポット案内アシスタントです。ユーザーの質問に対し、"
             "以下の『WiFiスポット情報』だけを根拠に、正確で有用な情報を提供してください。"
             "距離が近い順に並んでいる場合は、その順序を考慮して回答してください。"
             "利用時間、料金、認証方式などの詳細情報も含めて案内してください。"
             "情報が不足している場合は、正直にその旨を伝えてください。"),
            ("human", "質問: {question}\n\nWiFiスポット情報:\n{context}")
        ])
        
        # Retrieval function
        def retrieve_fn(inputs: Dict[str, Any]) -> List[Document]:
            return self.retriever.retrieve(
                query=inputs["question"],
                user_lat=inputs.get("user_lat"),
                user_lon=inputs.get("user_lon"),
                municipality=inputs.get("municipality"),
                k_final=inputs.get("k_results", self.settings.DEFAULT_K_RESULTS),
                filter_free_only=inputs.get("filter_free_only", False),
                filter_24h_only=inputs.get("filter_24h_only", False),
                provider=inputs.get("provider")
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
        filter_free_only: bool = False,
        filter_24h_only: bool = False,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for WiFi spots based on query and location.
        
        Args:
            query: Search query
            user_lat: User's latitude
            user_lon: User's longitude
            municipality: Filter by municipality
            k_results: Number of results to consider
            filter_free_only: Only return free WiFi spots
            filter_24h_only: Only return 24-hour available WiFi spots
            provider: Filter by specific provider
        
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
            "filter_free_only": filter_free_only,
            "filter_24h_only": filter_24h_only,
            "provider": provider
        }
        
        # Get documents for metadata
        docs = self.retriever.retrieve(
            query=query,
            user_lat=user_lat,
            user_lon=user_lon,
            municipality=municipality,
            k_final=k_results,
            filter_free_only=filter_free_only,
            filter_24h_only=filter_24h_only,
            provider=provider
        )
        
        # Get answer from chain
        answer = self.chain.invoke(inputs)
        answer_text = extract_llm_response_text(answer)
        
        # Prepare source documents
        sources = []
        for doc in docs:
            source = {
                "facility_name": doc.metadata.get("facility_name"),
                "location_name": doc.metadata.get("location_name"),
                "address": doc.metadata.get("address"),
                "municipality": doc.metadata.get("municipality"),
                "lat": doc.metadata.get("lat"),
                "lon": doc.metadata.get("lon"),
                "distance_km": doc.metadata.get("distance_km"),
                "provider": doc.metadata.get("provider"),
                "ssid": doc.metadata.get("ssid"),
                "available_hours": doc.metadata.get("available_hours"),
                "fee": doc.metadata.get("fee"),
                "auth_method": doc.metadata.get("auth_method"),
                "phone": doc.metadata.get("phone"),
                "url": doc.metadata.get("url"),
                "notes": doc.metadata.get("notes"),
                "is_free": doc.metadata.get("is_free"),
                "is_24h": doc.metadata.get("is_24h")
            }
            sources.append(source)
        
        return {
            "answer": answer_text,
            "sources": sources,
            "total_results": len(docs)
        }