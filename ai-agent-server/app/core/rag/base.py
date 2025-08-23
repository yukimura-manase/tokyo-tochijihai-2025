"""Base classes for RAG systems."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

from config import Settings


class BaseHybridRetriever(ABC):
    """Base class for hybrid retrievers combining semantic search with filtering."""
    
    def __init__(
        self, 
        vectorstore: Chroma, 
        k_semantic: int = 30, 
        radius_km: Optional[float] = None
    ):
        self.vectorstore = vectorstore
        self.k_semantic = k_semantic
        self.radius_km = radius_km
    
    @abstractmethod
    def retrieve(self, query: str, **kwargs) -> List[Document]:
        """Retrieve documents based on query and filters."""
        pass


class BaseRAG(ABC):
    """Base class for RAG systems."""
    
    def __init__(
        self,
        persist_dir: str,
        settings: Settings,
        collection_name: str
    ):
        self.persist_dir = persist_dir
        self.settings = settings
        self.collection_name = collection_name
        
        # Initialize embeddings
        self.embeddings = self._initialize_embeddings()
        
        # Initialize LLM
        self.llm = self._initialize_llm()
    
    def _initialize_embeddings(self):
        """Initialize embedding model."""
        if self.settings.openai_available:
            return OpenAIEmbeddings(model=self.settings.OPENAI_EMBEDDING_MODEL)
        else:
            return HuggingFaceEmbeddings(
                model_name=self.settings.EMBEDDING_MODEL,
                model_kwargs={'device': self.settings.EMBEDDING_DEVICE},
                encode_kwargs={'normalize_embeddings': True}
            )
    
    def _initialize_llm(self):
        """Initialize LLM."""
        if self.settings.openai_available:
            from ..llm.openai import OpenAILLM
            return OpenAILLM(self.settings).llm
        else:
            from ..llm.ollama import OllamaLLM
            return OllamaLLM(self.settings).llm
    
    def _load_existing_vectorstore(self) -> Optional[Chroma]:
        """Load existing vector store if it exists."""
        if Path(self.persist_dir).exists():
            print(f"Loading existing vector store from {self.persist_dir}")
            return Chroma(
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir,
                collection_name=self.collection_name
            )
        return None
    
    def _create_vectorstore(self, documents: List[Document]) -> Chroma:
        """Create new vector store from documents."""
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_dir,
            collection_name=self.collection_name
        )
        
        # Persist the vector store
        vectorstore.persist()
        print(f"Vector store created with {len(documents)} documents")
        
        return vectorstore
    
    @abstractmethod
    def _load_documents(self) -> List[Document]:
        """Load documents from data source."""
        pass
    
    @abstractmethod
    def search(self, query: str, **kwargs) -> Dict[str, Any]:
        """Search for information using RAG."""
        pass
    
    def rebuild_index(self) -> bool:
        """Rebuild the vector store from scratch."""
        try:
            # Delete existing vector store
            import shutil
            if Path(self.persist_dir).exists():
                shutil.rmtree(self.persist_dir)
            
            # Reload documents and recreate vector store
            documents = self._load_documents()
            self.vectorstore = self._create_vectorstore(documents)
            
            # Reinitialize retriever if it exists
            if hasattr(self, 'retriever'):
                self._initialize_retriever()
            
            return True
        except Exception as e:
            print(f"Error rebuilding index: {e}")
            return False
    
    @abstractmethod
    def _initialize_retriever(self):
        """Initialize the retriever component."""
        pass