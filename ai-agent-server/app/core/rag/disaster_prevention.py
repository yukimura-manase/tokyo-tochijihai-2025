"""Disaster prevention RAG system for PDF document search."""

from typing import List, Dict, Any
from pathlib import Path

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel

from core.rag.base import BaseRAG
from core.data.loaders.pdf_loader import load_pdf_as_documents, load_multiple_pdfs_as_documents
from config import Settings
from utils import extract_llm_response_text


class DisasterPreventionRAG(BaseRAG):
    """
    RAG system for disaster prevention PDF documents.
    """
    
    def __init__(self, settings: Settings):
        self.pdf_path = settings.PDF_PATH
        self.chunk_size = settings.PDF_CHUNK_SIZE
        self.chunk_overlap = settings.PDF_CHUNK_OVERLAP
        
        super().__init__(
            persist_dir=settings.PDF_PERSIST_DIR,
            settings=settings,
            collection_name="disaster_prevention"
        )
        
        # Initialize or load vector store
        self.vectorstore = self._initialize_vectorstore()
        
        # Build RAG chain
        self.chain = self._build_chain()
    
    def _load_documents(self) -> List[Document]:
        """Load disaster prevention documents from PDF(s)."""
        # Handle single PDF or directory
        if Path(self.pdf_path).is_file():
            return load_pdf_as_documents(
                self.pdf_path, 
                chunk_size=self.chunk_size, 
                chunk_overlap=self.chunk_overlap
            )
        elif Path(self.pdf_path).is_dir():
            return load_multiple_pdfs_as_documents(
                self.pdf_path, 
                chunk_size=self.chunk_size, 
                chunk_overlap=self.chunk_overlap
            )
        else:
            raise FileNotFoundError(f"PDF path not found: {self.pdf_path}")
    
    def _initialize_vectorstore(self):
        """Initialize or load the vector store."""
        # Try to load existing vector store
        vectorstore = self._load_existing_vectorstore()
        if vectorstore:
            return vectorstore
        
        # Create new vector store
        print(f"Creating new PDF vector store from {self.pdf_path}")
        docs = self._load_documents()
        
        if not docs:
            raise ValueError(f"No documents loaded from {self.pdf_path}")
        
        return self._create_vectorstore(docs)
    
    def _initialize_retriever(self):
        """Initialize retriever (not needed for simple PDF search)."""
        pass
    
    def _build_chain(self):
        """Build the RAG chain for PDF documents."""
        # Prompt template for disaster prevention documents
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "あなたは防災計画に詳しい専門家です。以下の『防災計画文書』の内容に基づいて、"
             "ユーザーの質問に対し正確で有用な情報を提供してください。"
             "情報が文書に含まれていない場合は、その旨を正直に伝えてください。"
             "回答には、参照したページ番号や章も含めてください。"),
            ("human", "質問: {question}\n\n防災計画文書:\n{context}")
        ])
        
        # Retrieval function
        def retrieve_fn(inputs: Dict[str, Any]) -> List[Document]:
            return self.vectorstore.similarity_search(
                query=inputs["question"],
                k=inputs.get("k_results", 6)
            )
        
        retrieve = RunnableLambda(retrieve_fn)
        
        # Context formatting
        def format_context(docs: List[Document]) -> str:
            lines = []
            for i, doc in enumerate(docs, 1):
                page = doc.metadata.get("page", "不明")
                source = doc.metadata.get("source", "不明")
                chunk_info = f"[文書: {source}, ページ: {page + 1}]" if page != "不明" else f"[文書: {source}]"
                
                lines.append(f"{i}. {chunk_info}")
                lines.append(doc.page_content)
                lines.append("")  # Empty line between entries
            
            return "\n".join(lines)
        
        to_prompt = RunnableLambda(
            lambda x: {
                "question": x["question"],
                "context": format_context(x["docs"])
            }
        )
        
        # Build chain
        chain = (
            RunnableParallel({
                "docs": retrieve,
                "question": lambda x: x["question"]
            })
            | to_prompt
            | prompt
            | self.llm
        )
        
        return chain
    
    def search(
        self,
        query: str,
        k_results: int = 6
    ) -> Dict[str, Any]:
        """
        Search for information in disaster prevention documents.
        
        Args:
            query: Search query
            k_results: Number of results to consider
        
        Returns:
            Dictionary with answer and source documents
        """
        # Prepare inputs
        inputs = {
            "question": query,
            "k_results": k_results
        }
        
        # Get documents for metadata
        docs = self.vectorstore.similarity_search(
            query=query,
            k=k_results
        )
        
        # Get answer from chain
        answer = self.chain.invoke(inputs)
        answer_text = extract_llm_response_text(answer)
        
        # Prepare source documents
        sources = []
        for doc in docs:
            source = {
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "source": doc.metadata.get("source"),
                "page": doc.metadata.get("page"),
                "chunk_index": doc.metadata.get("chunk_index"),
                "document_type": doc.metadata.get("document_type"),
                "file_path": doc.metadata.get("file_path")
            }
            sources.append(source)
        
        return {
            "answer": answer_text,
            "sources": sources,
            "total_results": len(docs)
        }