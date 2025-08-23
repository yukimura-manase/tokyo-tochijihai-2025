"""Chat endpoints for basic LLM interactions."""

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_ollama import OllamaLLM

from config import get_settings
from api.models.schemas import ChatRequest, ChatResponse, ChatCompletionRequest

router = APIRouter()
settings = get_settings()

# Initialize Ollama LLM
ollama_llm = OllamaLLM(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL
)


async def generate_stream(prompt: str, temperature: float, max_tokens: int):
    """Generate streaming response."""
    try:
        for chunk in ollama_llm.stream(
            prompt,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Basic chat endpoint."""
    try:
        response = ollama_llm.invoke(
            request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating response: {str(e)}"
        )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint."""
    if not request.stream:
        raise HTTPException(
            status_code=400, 
            detail="Stream parameter must be true for this endpoint"
        )
    
    return StreamingResponse(
        generate_stream(request.prompt, request.temperature, request.max_tokens),
        media_type="text/event-stream"
    )


@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """OpenAI-compatible chat completions endpoint."""
    try:
        conversation = "\n".join([f"{msg.role}: {msg.content}" for msg in request.messages])
        
        if request.stream:
            return StreamingResponse(
                generate_stream(conversation, request.temperature, request.max_tokens),
                media_type="text/event-stream"
            )
        else:
            response = ollama_llm.invoke(
                conversation,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            return {
                "id": "chatcmpl-123",
                "object": "chat.completion",
                "created": 1677652288,
                "model": settings.OLLAMA_MODEL,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(conversation.split()),
                    "completion_tokens": len(response.split()),
                    "total_tokens": len(conversation.split()) + len(response.split())
                }
            }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating response: {str(e)}"
        )