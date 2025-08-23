"""Health check and status endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from langchain_ollama import OllamaLLM

from config import get_settings
from api.models.schemas import HealthResponse

router = APIRouter()
settings = get_settings()

# Initialize Ollama LLM for health checks
ollama_llm = OllamaLLM(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL
)


@router.get("/")
async def root():
    """Root endpoint."""
    return {"message": f"{settings.APP_NAME} is running"}


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint that tests Ollama connection."""
    try:
        response = ollama_llm.invoke("test")
        return HealthResponse(
            status="healthy", 
            model=settings.OLLAMA_MODEL, 
            ollama_connection="ok"
        )
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Ollama service unavailable: {str(e)}"
        )