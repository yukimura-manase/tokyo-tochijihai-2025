"""WiFi spot search endpoints."""

from fastapi import APIRouter, HTTPException
from core.rag.wifi import WiFiRAG
from config import get_settings
from api.models.schemas import WiFiSearchRequest, WiFiSearchResponse, RebuildIndexResponse, StatusResponse

router = APIRouter()

# Global WiFi RAG instance - initialized on first use
wifi_rag = None


def get_wifi_rag():
    """Get or initialize WiFi RAG system."""
    global wifi_rag
    if wifi_rag is None:
        try:
            settings = get_settings()
            print("Initializing WiFi RAG system...")
            wifi_rag = WiFiRAG(settings)
            print("WiFi RAG system initialized successfully")
        except Exception as e:
            print(f"Failed to initialize WiFi RAG: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initialize WiFi RAG system: {str(e)}"
            )
    return wifi_rag


@router.post("/wifi/search", response_model=WiFiSearchResponse)
async def wifi_search(request: WiFiSearchRequest):
    """Search for WiFi spots using location-aware RAG."""
    wifi_rag_instance = get_wifi_rag()
    
    try:
        result = wifi_rag_instance.search(
            query=request.query,
            user_lat=request.user_lat,
            user_lon=request.user_lon,
            municipality=request.municipality,
            k_results=request.k_results,
            filter_free_only=request.filter_free_only,
            filter_24h_only=request.filter_24h_only,
            provider=request.provider
        )
        
        return WiFiSearchResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error performing WiFi search: {str(e)}"
        )


@router.post("/wifi/rebuild-index", response_model=RebuildIndexResponse)
async def rebuild_wifi_index():
    """Rebuild the WiFi RAG vector store index from scratch."""
    wifi_rag_instance = get_wifi_rag()
    
    try:
        success = wifi_rag_instance.rebuild_index()
        if success:
            return RebuildIndexResponse(message="WiFi RAG index rebuilt successfully")
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to rebuild WiFi RAG index"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error rebuilding WiFi RAG index: {str(e)}"
        )


@router.get("/wifi/status", response_model=StatusResponse)
async def wifi_status():
    """Get the status of the WiFi RAG system."""
    try:
        wifi_rag_instance = get_wifi_rag()
        
        # Check if vector store is accessible
        test_results = wifi_rag_instance.vectorstore.similarity_search(
            query="test",
            k=1
        )
        
        settings = get_settings()
        return StatusResponse(
            status="healthy",
            message=f"WiFi RAG system operational. Excel: {settings.WIFI_EXCEL_PATH}, "
                   f"Persist: {settings.WIFI_PERSIST_DIR}"
        )
    except Exception as e:
        return StatusResponse(
            status="unhealthy",
            error=str(e)
        )