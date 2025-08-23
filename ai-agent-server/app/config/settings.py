"""Configuration settings for the AI Agent Server."""

import os
from typing import Optional
from pathlib import Path
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""
    
    # Application settings
    APP_NAME: str = "AI Agent Server"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Ollama settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "phi4-mini")
    
    # OpenAI settings
    USE_OPENAI: bool = os.getenv("USE_OPENAI", "false").lower() == "true"
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    
    # Embedding settings
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")
    EMBEDDING_DEVICE: str = os.getenv("EMBEDDING_DEVICE", "cpu")
    
    # Data paths
    DATASET_BASE_DIR: str = os.getenv("DATASET_BASE_DIR", "/app/dataset")
    
    # Evacuation RAG settings
    EVAC_CSV_PATH: str = os.getenv(
        "EVAC_CSV_PATH", 
        "/app/dataset/001_避難所位置情報/130001_evacuation_area.csv"
    )
    EVAC_PERSIST_DIR: str = os.getenv("EVAC_PERSIST_DIR", "/app/chroma_evac")
    
    # PDF RAG settings  
    PDF_PATH: str = os.getenv(
        "PDF_PATH", 
        "/app/dataset/003_防災計画/2023_1.pdf"
    )
    PDF_PERSIST_DIR: str = os.getenv("PDF_PERSIST_DIR", "/app/chroma_pdf")
    PDF_CHUNK_SIZE: int = int(os.getenv("PDF_CHUNK_SIZE", "1000"))
    PDF_CHUNK_OVERLAP: int = int(os.getenv("PDF_CHUNK_OVERLAP", "200"))
    
    # WiFi RAG settings
    WIFI_EXCEL_PATH: str = os.getenv(
        "WIFI_EXCEL_PATH", 
        "/app/dataset/002_wifiスポット/130001_public_wireless_lan_20240901.xlsx"
    )
    WIFI_PERSIST_DIR: str = os.getenv("WIFI_PERSIST_DIR", "/app/chroma_wifi")
    
    # Vector store settings
    CHROMA_BASE_DIR: str = os.getenv("CHROMA_BASE_DIR", "/app/chroma_db")
    
    # RAG settings
    DEFAULT_K_SEMANTIC: int = int(os.getenv("DEFAULT_K_SEMANTIC", "30"))
    DEFAULT_K_RESULTS: int = int(os.getenv("DEFAULT_K_RESULTS", "8"))
    DEFAULT_RADIUS_KM: Optional[float] = (
        float(os.getenv("DEFAULT_RADIUS_KM")) 
        if os.getenv("DEFAULT_RADIUS_KM") 
        else None
    )
    
    # LLM settings
    DEFAULT_TEMPERATURE: float = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
    DEFAULT_MAX_TOKENS: int = int(os.getenv("DEFAULT_MAX_TOKENS", "1000"))
    
    @property
    def evac_csv_exists(self) -> bool:
        """Check if evacuation CSV file exists."""
        return Path(self.EVAC_CSV_PATH).exists()
    
    @property
    def pdf_path_exists(self) -> bool:
        """Check if PDF path exists (file or directory)."""
        return Path(self.PDF_PATH).exists()
    
    @property
    def wifi_excel_exists(self) -> bool:
        """Check if WiFi Excel file exists."""
        return Path(self.WIFI_EXCEL_PATH).exists()
    
    @property
    def openai_available(self) -> bool:
        """Check if OpenAI is available (API key provided and USE_OPENAI is True)."""
        return self.USE_OPENAI and self.OPENAI_API_KEY is not None
    
    def ensure_directories(self) -> None:
        """Ensure all required directories exist."""
        directories = [
            self.EVAC_PERSIST_DIR,
            self.PDF_PERSIST_DIR, 
            self.WIFI_PERSIST_DIR,
            self.CHROMA_BASE_DIR,
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()