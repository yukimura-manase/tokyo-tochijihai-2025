"""Main FastAPI application with modular architecture."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes import health, chat, rag, pdf, wifi

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Agent Server for disaster prevention and information services"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(chat.router, tags=["chat"])
app.include_router(rag.router, tags=["evacuation"])
app.include_router(pdf.router, tags=["disaster-prevention"])
app.include_router(wifi.router, tags=["wifi"])


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print(f"{settings.APP_NAME} v{settings.APP_VERSION} starting up...")
    print("RAG systems will be initialized on demand for faster startup")
    
    # Ensure required directories exist
    settings.ensure_directories()
    
    print(f"Server will run on {settings.HOST}:{settings.PORT}")
    print(f"Debug mode: {settings.DEBUG}")
    print(f"Using OpenAI: {settings.openai_available}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    print(f"{settings.APP_NAME} shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=settings.HOST, 
        port=settings.PORT,
        reload=settings.DEBUG
    )