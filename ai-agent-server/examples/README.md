# Tokyo Disaster Response RAG Client

Python client environment for making requests to the dockerized Tokyo Disaster Response AI Agent Server.

## Overview

This client environment allows you to interact with the RAG (Retrieval-Augmented Generation) services running in Docker containers:

- **FastAPI Server** (Port 8000): RAG endpoints for evacuation shelters, disaster prevention PDFs, and WiFi spots
- **Ollama Server** (Port 11434): LLM inference server
- **Main Application Server** (Port 3777): Hono-based main server
- **Frontend** (Port 3222): React application

## Prerequisites

1. [uv](https://docs.astral.sh/uv/) - Fast Python package installer and resolver
2. Docker and Docker Compose
3. Python 3.9+

## Quick Setup

### 1. Install uv

```bash
# On macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Start the Docker Services

Navigate to the ai-agent-server directory and start the services:

```bash
cd ../
docker-compose up -d
```

Wait for all services to be healthy (especially the Ollama service).

### 3. Setup Python Environment

```bash
# Create and activate virtual environment
uv sync

# Activate the environment (if needed)
source .venv/bin/activate  # On Linux/macOS
# or
.venv\Scripts\activate     # On Windows
```

### 4. Test the Connection

```bash
# Test the RAG API
uv run python test_rag_api.py

# Test the basic API
uv run python test_api.py
```

## Available Services

### FastAPI Server (http://localhost:8000)

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Endpoints:
- **Evacuation RAG**: `/rag/search` - Search for evacuation shelters
- **PDF RAG**: `/pdf/search` - Search disaster prevention documents  
- **WiFi RAG**: `/wifi/search` - Search for WiFi spots
- **Chat**: `/chat` - Basic chat with LLM
- **Chat Completions**: `/chat/completions` - OpenAI-compatible chat
- **Streaming**: `/chat/stream` - Streaming chat responses

### Using the RAG Client

```python
from client.rag_client import UnifiedRAGClient

# Initialize client
client = UnifiedRAGClient(base_url="http://localhost:8000")

# Wait for services to be ready
if client.wait_for_all_systems():
    print("All systems ready!")
    
    # Search evacuation shelters near coordinates
    result = client.evacuation.search(
        query="近くの避難所を教えて",
        user_lat=35.6762,  # Tokyo Station
        user_lon=139.7653,
        municipality="千代田区"
    )
    result.print_summary()
    
    # Search disaster prevention documents
    pdf_result = client.pdf.search(
        query="地震対策について教えて"
    )
    pdf_result.print_summary()
    
    # Search WiFi spots
    wifi_result = client.wifi.search(
        query="近くの無料WiFiスポット",
        user_lat=35.6762,
        user_lon=139.7653
    )
    wifi_result.print_summary()
```

### Example API Calls

#### Evacuation Shelter Search
```python
import requests

response = requests.post("http://localhost:8000/rag/search", json={
    "query": "千代田区の避難所を教えて",
    "user_lat": 35.6762,
    "user_lon": 139.7653,
    "municipality": "千代田区",
    "k_results": 5
})
print(response.json())
```

#### PDF Document Search
```python
import requests

response = requests.post("http://localhost:8000/pdf/search", json={
    "query": "災害時の避難手順について",
    "k_results": 3
})
print(response.json())
```

#### Chat with LLM
```python
import requests

response = requests.post("http://localhost:8000/chat", json={
    "prompt": "災害時に必要な準備について教えてください",
    "temperature": 0.7,
    "max_tokens": 200
})
print(response.json())
```

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run python test_rag_api.py
uv run python test_api.py
```

### Code Formatting

```bash
# Format code with black
uv run black .

# Sort imports with isort  
uv run isort .

# Type checking with mypy
uv run mypy .
```

### Adding Dependencies

```bash
# Add a new dependency
uv add package-name

# Add a development dependency
uv add --dev package-name
```

## Troubleshooting

### Docker Services Not Ready
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs fastapi
docker-compose logs ollama

# Restart services
docker-compose restart
```

### Connection Errors
- Ensure Docker services are running and healthy
- Check port forwarding (8000 for FastAPI, 11434 for Ollama)
- Verify no other services are using the same ports

### Python Environment Issues
```bash
# Reset environment
uv sync --reinstall

# Check installed packages
uv pip list

# Update all packages
uv sync --upgrade
```

## Environment Configuration

The client connects to the following default endpoints:
- FastAPI: `http://localhost:8000`
- Ollama: `http://localhost:11434`
- Main Server: `http://localhost:3777`
- Frontend: `http://localhost:3222`

You can modify these URLs in the client code or set environment variables as needed.

## API Documentation

Once the FastAPI server is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc