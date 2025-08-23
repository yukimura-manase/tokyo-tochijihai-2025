"""PDF (disaster prevention) search endpoints."""

from fastapi import APIRouter, HTTPException
from core.rag.disaster_prevention import DisasterPreventionRAG
from config import get_settings
from api.models.schemas import PDFSearchRequest, PDFSearchResponse, RebuildIndexResponse, StatusResponse

router = APIRouter()

# Global PDF RAG instance - initialized on first use
pdf_rag = None


def get_pdf_rag():
    """Get or initialize PDF RAG system."""
    global pdf_rag
    if pdf_rag is None:
        try:
            settings = get_settings()
            print("Initializing PDF RAG system...")
            pdf_rag = DisasterPreventionRAG(settings)
            print("PDF RAG system initialized successfully")
        except Exception as e:
            print(f"Failed to initialize PDF RAG: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initialize PDF RAG system: {str(e)}"
            )
    return pdf_rag


@router.post("/pdf/search", response_model=PDFSearchResponse)
async def pdf_search(request: PDFSearchRequest):
    """Search for information in disaster prevention PDF documents."""
    pdf_rag_instance = get_pdf_rag()
    
    try:
        result = pdf_rag_instance.search(
            query=request.query,
            k_results=request.k_results
        )
        
        return PDFSearchResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing PDF search: {str(e)}"
        )


@router.post("/pdf/rebuild-index", response_model=RebuildIndexResponse)
async def rebuild_pdf_index():
    """Rebuild the PDF RAG vector store index from scratch."""
    pdf_rag_instance = get_pdf_rag()
    
    try:
        success = pdf_rag_instance.rebuild_index()
        if success:
            return RebuildIndexResponse(message="PDF RAG index rebuilt successfully")
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to rebuild PDF RAG index"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error rebuilding PDF RAG index: {str(e)}"
        )


@router.get("/pdf/status", response_model=StatusResponse)
async def pdf_status():
    """Get the status of the PDF RAG system."""
    try:
        pdf_rag_instance = get_pdf_rag()
        
        # Check if vector store is accessible
        test_results = pdf_rag_instance.vectorstore.similarity_search(
            query="test",
            k=1
        )
        
        settings = get_settings()
        return StatusResponse(
            status="healthy",
            message=f"PDF RAG system operational. Path: {settings.PDF_PATH}, "
                   f"Persist: {settings.PDF_PERSIST_DIR}, "
                   f"Chunks: {settings.PDF_CHUNK_SIZE}/{settings.PDF_CHUNK_OVERLAP}"
        )
    except Exception as e:
        return StatusResponse(
            status="unhealthy",
            error=str(e)
        )