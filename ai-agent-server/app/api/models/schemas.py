"""Pydantic schemas for API requests and responses."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


# Chat models
class ChatRequest(BaseModel):
    """Request model for basic chat endpoint."""
    prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    """Response model for basic chat endpoint."""
    response: str
    model: str = "phi4-mini"


class Message(BaseModel):
    """Chat message model."""
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    """Request model for OpenAI-compatible chat completions endpoint."""
    messages: List[Message]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    stream: Optional[bool] = False


# RAG models
class RAGSearchRequest(BaseModel):
    """Request model for evacuation area RAG search."""
    query: str
    user_lat: Optional[float] = None
    user_lon: Optional[float] = None
    municipality: Optional[str] = None
    k_results: Optional[int] = 8
    filter_barrier_free: Optional[bool] = False
    filter_hazard: Optional[str] = None


class RAGSearchResponse(BaseModel):
    """Response model for evacuation area RAG search."""
    answer: str
    sources: List[Dict[str, Any]]
    total_results: int


# PDF models
class PDFSearchRequest(BaseModel):
    """Request model for PDF document search."""
    query: str
    k_results: Optional[int] = 6


class PDFSearchResponse(BaseModel):
    """Response model for PDF document search."""
    answer: str
    sources: List[Dict[str, Any]]
    total_results: int


# WiFi models
class WiFiSearchRequest(BaseModel):
    """Request model for WiFi spot search."""
    query: str
    user_lat: Optional[float] = None
    user_lon: Optional[float] = None
    municipality: Optional[str] = None
    k_results: Optional[int] = 8
    filter_free_only: Optional[bool] = False
    filter_24h_only: Optional[bool] = False
    provider: Optional[str] = None


class WiFiSearchResponse(BaseModel):
    """Response model for WiFi spot search."""
    answer: str
    sources: List[Dict[str, Any]]
    total_results: int


# Health check models
class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    model: str
    ollama_connection: str


class StatusResponse(BaseModel):
    """Generic status response model."""
    status: str
    message: Optional[str] = None
    error: Optional[str] = None


# Index rebuild models
class RebuildIndexResponse(BaseModel):
    """Response model for index rebuild operations."""
    message: str