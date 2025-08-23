"""Chat endpoint tests."""

import pytest
import requests
import json
from typing import Dict, Any


@pytest.mark.chat
@pytest.mark.integration
class TestChatEndpoints:
    """Test suite for chat-related endpoints."""

    def test_basic_chat_endpoint(self, http_client: requests.Session, api_base_url: str, sample_chat_payload: Dict[str, Any]):
        """Test basic chat endpoint with simple prompt."""
        response = http_client.post(f"{api_base_url}/chat", json=sample_chat_payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "response" in data
        assert isinstance(data["response"], str)
        assert len(data["response"]) > 0

    def test_chat_completions_endpoint(self, http_client: requests.Session, api_base_url: str, sample_completions_payload: Dict[str, Any]):
        """Test OpenAI-compatible completions endpoint."""
        response = http_client.post(f"{api_base_url}/chat/completions", json=sample_completions_payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check OpenAI-compatible response format
        assert "choices" in data
        assert "id" in data
        assert "object" in data
        assert "created" in data
        assert "model" in data
        
        # Check choices structure
        assert len(data["choices"]) > 0
        choice = data["choices"][0]
        assert "message" in choice
        assert "content" in choice["message"]
        assert "role" in choice["message"]

    def test_chat_with_temperature_variation(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with different temperature values."""
        base_payload = {
            "prompt": "Say exactly: 'Test response'",
            "max_tokens": 50
        }
        
        temperatures = [0.0, 0.5, 1.0]
        responses = []
        
        for temp in temperatures:
            payload = {**base_payload, "temperature": temp}
            response = http_client.post(f"{api_base_url}/chat", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            responses.append(data["response"])
        
        # All responses should be valid strings
        assert all(isinstance(resp, str) and len(resp) > 0 for resp in responses)

    def test_chat_with_max_tokens_limit(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with max tokens limitation."""
        payload = {
            "prompt": "Write a very long story about a robot",
            "temperature": 0.7,
            "max_tokens": 20
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        
        # Response should be limited by max_tokens (rough check)
        words = data["response"].split()
        assert len(words) <= 30  # Allow some buffer for token/word conversion

    def test_chat_with_japanese_input(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with Japanese text input."""
        payload = {
            "prompt": "こんにちは。日本語で返答してください。",
            "temperature": 0.7,
            "max_tokens": 100
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0

    def test_chat_empty_prompt(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with empty prompt."""
        payload = {
            "prompt": "",
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        
        # Should handle empty prompts gracefully
        assert response.status_code in [200, 400, 422]

    def test_chat_invalid_temperature(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with invalid temperature values."""
        payload = {
            "prompt": "Test prompt",
            "temperature": -1.0,  # Invalid temperature
            "max_tokens": 50
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_chat_missing_required_field(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with missing required fields."""
        payload = {
            "temperature": 0.7,
            "max_tokens": 50
            # Missing 'prompt' field
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_chat_response_headers(self, http_client: requests.Session, api_base_url: str, sample_chat_payload: Dict[str, Any]):
        """Test that chat endpoint returns proper headers."""
        response = http_client.post(f"{api_base_url}/chat", json=sample_chat_payload)
        
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")

    @pytest.mark.slow
    def test_chat_response_time(self, http_client: requests.Session, api_base_url: str):
        """Test that chat endpoint responds within reasonable time."""
        import time
        
        payload = {
            "prompt": "What is 1+1?",
            "temperature": 0.0,
            "max_tokens": 10
        }
        
        start_time = time.time()
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        response_time = time.time() - start_time
        
        assert response.status_code == 200
        # Should respond within 30 seconds for simple queries
        assert response_time < 30.0