"""Pytest configuration and fixtures for FastAPI integration tests."""

import asyncio
import time
from typing import Generator, AsyncGenerator
import pytest
import requests
import aiohttp
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# Test configuration
API_BASE_URL = "http://localhost:8000"
OLLAMA_BASE_URL = "http://localhost:11434"
STARTUP_TIMEOUT = 60  # seconds
RETRY_INTERVAL = 2    # seconds


def wait_for_service(url: str, timeout: int = STARTUP_TIMEOUT) -> bool:
    """Wait for a service to become available."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{url}/health" if "8000" in url else url, timeout=5)
            if response.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(RETRY_INTERVAL)
    return False


@pytest.fixture(scope="session")
def ensure_services_running():
    """Ensure both FastAPI and Ollama services are running before tests."""
    print("\n⏳ Checking if services are available...")
    
    # Check FastAPI service
    if not wait_for_service(API_BASE_URL):
        pytest.skip("FastAPI service not available. Please run 'docker-compose up' first.")
    
    # Check Ollama service  
    if not wait_for_service(OLLAMA_BASE_URL):
        pytest.skip("Ollama service not available. Please run 'docker-compose up' first.")
    
    print("✅ All services are running")


@pytest.fixture(scope="session")
def http_client(ensure_services_running) -> Generator[requests.Session, None, None]:
    """Create a configured requests session for HTTP tests."""
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Set default timeout
    session.timeout = 30
    
    yield session
    session.close()


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def async_client(ensure_services_running) -> AsyncGenerator[aiohttp.ClientSession, None]:
    """Create an async HTTP client for async tests."""
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        yield session


@pytest.fixture
def api_base_url() -> str:
    """Get the API base URL."""
    return API_BASE_URL


@pytest.fixture  
def sample_chat_payload():
    """Sample payload for chat endpoint tests."""
    return {
        "prompt": "Hello, what is 2+2?",
        "temperature": 0.7,
        "max_tokens": 50
    }


@pytest.fixture
def sample_completions_payload():
    """Sample payload for OpenAI-compatible completions endpoint."""
    return {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is 2+2?"}
        ],
        "temperature": 0.7,
        "max_tokens": 50
    }


@pytest.fixture
def sample_rag_payload():
    """Sample payload for RAG endpoint tests."""
    return {
        "query": "避難所はどこにありますか？",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "k": 5
    }


@pytest.fixture
def sample_pdf_payload():
    """Sample payload for PDF RAG endpoint tests."""
    return {
        "query": "災害時の対応について教えてください",
        "k": 3
    }


@pytest.fixture
def sample_wifi_payload():
    """Sample payload for WiFi RAG endpoint tests."""
    return {
        "query": "新宿駅周辺のWiFiスポットを教えて",
        "latitude": 35.6896,
        "longitude": 139.7006,
        "k": 5
    }