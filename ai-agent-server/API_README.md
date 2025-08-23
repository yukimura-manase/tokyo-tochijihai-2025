# AI Agent Server API Documentation

## Overview

This FastAPI server provides an AI-powered chat interface using the Phi4-mini model via Ollama, along with a specialized RAG (Retrieval-Augmented Generation) system for evacuation area search in Tokyo.

**Base URL:** `http://localhost:8000`

## Features

- Chat completions using Phi4-mini model
- Streaming responses
- OpenAI-compatible API format
- Location-aware evacuation shelter search
- Geographic filtering and ranking
- Barrier-free facility filtering

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EVAC_CSV_PATH` | `/app/dataset/001_避難所位置情報/130001_evacuation_area.csv` | Path to evacuation data CSV |
| `EVAC_PERSIST_DIR` | `/app/chroma_evac` | Vector store persistence directory |
| `USE_OPENAI` | `false` | Use OpenAI instead of local models |
| `OPENAI_API_KEY` | `None` | OpenAI API key (if using OpenAI) |

## API Endpoints

### 1. Root Endpoint

**GET /**

Returns a simple message confirming the API is running.

**Response:**
```json
{
    "message": "Ollama Phi4-mini API is running"
}
```

### 2. Health Check

**GET /health**

Checks the health of the service and Ollama connection.

**Response:**
```json
{
    "status": "healthy",
    "model": "phi4-mini",
    "ollama_connection": "ok"
}
```

**Error Response (503):**
```json
{
    "detail": "Ollama service unavailable: [error message]"
}
```

### 3. Basic Chat

**POST /chat**

Simple chat completion endpoint.

**Request Body:**
```json
{
    "prompt": "Hello, what is the capital of Japan?",
    "temperature": 0.7,
    "max_tokens": 1000,
    "stream": false
}
```

**Parameters:**
- `prompt` (string, required): The input prompt
- `temperature` (float, optional): Sampling temperature (default: 0.7)
- `max_tokens` (integer, optional): Maximum tokens in response (default: 1000)
- `stream` (boolean, optional): Enable streaming (default: false)

**Response:**
```json
{
    "response": "The capital of Japan is Tokyo.",
    "model": "phi4-mini"
}
```

### 4. Streaming Chat

**POST /chat/stream**

Streaming chat responses using Server-Sent Events.

**Request Body:**
```json
{
    "prompt": "Write a short story about a robot.",
    "temperature": 0.8,
    "max_tokens": 200,
    "stream": true
}
```

**Response:**
Content-Type: `text/event-stream`

```
data: {"chunk": "Once"}

data: {"chunk": " upon"}

data: {"chunk": " a"}
```

### 5. Chat Completions (OpenAI Compatible)

**POST /chat/completions**

OpenAI-compatible chat completions endpoint.

**Request Body:**
```json
{
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is machine learning?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150,
    "stream": false
}
```

**Parameters:**
- `messages` (array, required): Array of message objects
  - `role` (string): "system", "user", or "assistant"
  - `content` (string): Message content
- `temperature` (float, optional): Sampling temperature (default: 0.7)
- `max_tokens` (integer, optional): Maximum tokens (default: 1000)
- `stream` (boolean, optional): Enable streaming (default: false)

**Response:**
```json
{
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "phi4-mini",
    "choices": [{
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "Machine learning is..."
        },
        "finish_reason": "stop"
    }],
    "usage": {
        "prompt_tokens": 20,
        "completion_tokens": 30,
        "total_tokens": 50
    }
}
```

### 6. RAG Search

**POST /rag/search**

Search for evacuation areas using location-aware RAG.

**Request Body:**
```json
{
    "query": "近くの避難所を教えて",
    "user_lat": 35.681,
    "user_lon": 139.767,
    "municipality": "千代田区",
    "k_results": 5,
    "filter_barrier_free": false,
    "filter_hazard": "earthquake"
}
```

**Parameters:**
- `query` (string, required): Search query in natural language
- `user_lat` (float, optional): User's latitude for distance calculation
- `user_lon` (float, optional): User's longitude for distance calculation
- `municipality` (string, optional): Filter by municipality name
- `k_results` (integer, optional): Number of results to return (default: 8)
- `filter_barrier_free` (boolean, optional): Only return barrier-free facilities (default: false)
- `filter_hazard` (string, optional): Filter by hazard type ("earthquake", "flood", etc.)

**Response:**
```json
{
    "answer": "お近くの避難所をご案内します。東京駅周辺では以下の避難所が利用可能です...",
    "sources": [
        {
            "facility": "丸の内小学校",
            "address": "東京都千代田区丸の内1-1-1",
            "municipality": "千代田区",
            "lat": 35.6812,
            "lon": 139.7671,
            "distance_km": 0.5,
            "phone": "03-1234-5678",
            "is_barrier_free": true,
            "hazards": ["earthquake", "fire"]
        }
    ],
    "total_results": 5
}
```

### 7. Rebuild RAG Index

**POST /rag/rebuild-index**

Rebuild the vector store index from scratch.

**Response:**
```json
{
    "message": "RAG index rebuilt successfully"
}
```

**Error Response (500):**
```json
{
    "detail": "Failed to rebuild RAG index"
}
```

### 8. RAG System Status

**GET /rag/status**

Check the status of the RAG system.

**Response (Healthy):**
```json
{
    "status": "healthy",
    "csv_path": "/app/dataset/001_避難所位置情報/130001_evacuation_area.csv",
    "persist_dir": "/app/chroma_evac",
    "use_openai": false,
    "vector_store_accessible": true,
    "document_count": "available"
}
```

**Response (Not Initialized):**
```json
{
    "status": "not_initialized",
    "message": "Evacuation RAG system is not initialized"
}
```

**Response (Unhealthy):**
```json
{
    "status": "unhealthy",
    "error": "[error message]"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error
- `503`: Service Unavailable (Ollama or RAG system issues)

Error responses follow this format:
```json
{
    "detail": "Error message describing the issue"
}
```

## Usage Examples

### Basic Chat Example

```python
import requests

response = requests.post("http://localhost:8000/chat", json={
    "prompt": "Hello, how are you?",
    "temperature": 0.7
})
print(response.json())
```

### Evacuation Search Example

```python
import requests

# Search for nearby evacuation areas
response = requests.post("http://localhost:8000/rag/search", json={
    "query": "地震対応の避難所を探しています",
    "user_lat": 35.681,
    "user_lon": 139.767,
    "k_results": 5,
    "filter_hazard": "earthquake"
})

result = response.json()
print(f"Answer: {result['answer']}")
print(f"Found {result['total_results']} facilities")
```

### Streaming Chat Example

```python
import aiohttp
import asyncio
import json

async def stream_chat():
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "http://localhost:8000/chat/stream",
            json={"prompt": "Tell me a story", "stream": True}
        ) as response:
            async for line in response.content:
                if line:
                    decoded = line.decode('utf-8').strip()
                    if decoded.startswith('data: '):
                        data = json.loads(decoded[6:])
                        if 'chunk' in data:
                            print(data['chunk'], end='', flush=True)

asyncio.run(stream_chat())
```

## Model Information

- **Model**: Phi4-mini (via Ollama)
- **Base URL**: http://ollama:11434 (internal Docker network)
- **Capabilities**: Japanese and English text generation, conversation

## RAG System Details

The RAG system provides location-aware search for evacuation areas with the following features:

- **Semantic Search**: Uses multilingual embeddings for natural language queries
- **Geographic Filtering**: Distance-based ranking when coordinates are provided
- **Metadata Filtering**: Filter by municipality, barrier-free access, hazard types
- **Hybrid Retrieval**: Combines semantic similarity with geographic proximity

### Supported Hazard Types
- `earthquake` - 地震
- `flood` - 洪水
- `fire` - 火災
- `tsunami` - 津波

## Development and Testing

Test scripts are available in the `examples/` directory:

- `test_api.py`: Tests basic chat functionality
- `test_rag_api.py`: Tests RAG search capabilities

Run tests with:
```bash
python examples/test_api.py
python examples/test_rag_api.py
```