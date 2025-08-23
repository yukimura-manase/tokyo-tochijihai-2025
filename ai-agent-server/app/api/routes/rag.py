"""RAG (evacuation area) search endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from core.rag.evacuation import EvacuationRAG
from config import get_settings
from api.models.schemas import RAGSearchRequest, RAGSearchResponse, RebuildIndexResponse, StatusResponse

router = APIRouter()

# Global RAG instance - initialized on first use
evac_rag = None


def get_evac_rag():
    """Get or initialize Evacuation RAG system."""
    global evac_rag
    if evac_rag is None:
        try:
            settings = get_settings()
            print("Initializing Evacuation RAG system...")
            evac_rag = EvacuationRAG(settings)
            print("Evacuation RAG system initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Evacuation RAG: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initialize Evacuation RAG system: {str(e)}"
            )
    return evac_rag


@router.post("/rag/search", response_model=RAGSearchResponse)
async def rag_search(request: RAGSearchRequest):
    """Search for evacuation areas using location-aware RAG."""
    evac_rag_instance = get_evac_rag()
    
    try:
        result = evac_rag_instance.search(
            query=request.query,
            user_lat=request.user_lat,
            user_lon=request.user_lon,
            municipality=request.municipality,
            k_results=request.k_results,
            filter_barrier_free=request.filter_barrier_free,
            filter_hazard=request.filter_hazard
        )
        
        return RAGSearchResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error performing RAG search: {str(e)}"
        )


@router.post("/rag/rebuild-index", response_model=RebuildIndexResponse)
async def rebuild_rag_index():
    """Rebuild the RAG vector store index from scratch."""
    evac_rag_instance = get_evac_rag()
    
    try:
        success = evac_rag_instance.rebuild_index()
        if success:
            return RebuildIndexResponse(message="RAG index rebuilt successfully")
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to rebuild RAG index"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error rebuilding RAG index: {str(e)}"
        )


@router.get("/rag/status", response_model=StatusResponse)
async def rag_status():
    """Get the status of the RAG system."""
    try:
        evac_rag_instance = get_evac_rag()
        
        # Check if vector store is accessible
        test_results = evac_rag_instance.retriever.vectorstore.similarity_search(
            query="test",
            k=1
        )
        
        settings = get_settings()
        return StatusResponse(
            status="healthy",
            message=f"RAG system operational. CSV: {settings.EVAC_CSV_PATH}, "
                   f"Persist: {settings.EVAC_PERSIST_DIR}, "
                   f"OpenAI: {settings.openai_available}"
        )
    except Exception as e:
        return StatusResponse(
            status="unhealthy",
            error=str(e)
        )