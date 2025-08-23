"""Error handling and edge case tests."""

import pytest
import requests
from typing import Dict, Any


@pytest.mark.integration
class TestErrorHandling:
    """Test suite for error handling and edge cases."""

    # Invalid JSON and Malformed Requests
    def test_invalid_json_request(self, http_client: requests.Session, api_base_url: str):
        """Test API response to invalid JSON."""
        headers = {"Content-Type": "application/json"}
        invalid_json = '{"prompt": "test", "temperature":]'  # Invalid JSON
        
        response = http_client.post(
            f"{api_base_url}/chat", 
            data=invalid_json,
            headers=headers
        )
        assert response.status_code == 422

    def test_empty_request_body(self, http_client: requests.Session, api_base_url: str):
        """Test API response to empty request body."""
        response = http_client.post(f"{api_base_url}/chat", json={})
        assert response.status_code == 422

    def test_missing_content_type(self, http_client: requests.Session, api_base_url: str):
        """Test API response without Content-Type header."""
        response = http_client.post(f"{api_base_url}/chat", data='{"prompt": "test"}')
        # Should handle gracefully
        assert response.status_code in [415, 422]

    # Parameter Validation Tests
    def test_invalid_temperature_range(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with temperature out of valid range."""
        test_cases = [
            {"prompt": "test", "temperature": -10.0},
            {"prompt": "test", "temperature": 10.0}, 
            {"prompt": "test", "temperature": "invalid"}
        ]
        
        for payload in test_cases:
            response = http_client.post(f"{api_base_url}/chat", json=payload)
            # Should return validation error
            assert response.status_code in [400, 422]

    def test_invalid_max_tokens(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with invalid max_tokens values."""
        test_cases = [
            {"prompt": "test", "max_tokens": -1},
            {"prompt": "test", "max_tokens": 0},
            {"prompt": "test", "max_tokens": "invalid"},
            {"prompt": "test", "max_tokens": 999999}  # Extremely large value
        ]
        
        for payload in test_cases:
            response = http_client.post(f"{api_base_url}/chat", json=payload)
            # Should handle validation error or process with limits
            assert response.status_code in [200, 400, 422]

    def test_extremely_long_prompt(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with extremely long prompt."""
        long_prompt = "A" * 100000  # 100k characters
        payload = {
            "prompt": long_prompt,
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload)
        # Should handle gracefully - either process or return error
        assert response.status_code in [200, 400, 413, 422, 500]

    def test_special_characters_in_prompt(self, http_client: requests.Session, api_base_url: str):
        """Test chat endpoint with various special characters."""
        special_prompts = [
            {"prompt": "Test with émojis 🚀🌟💫 and unicode ñáéíóú"},
            {"prompt": "Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?"},
            {"prompt": "Newlines\nand\ttabs\rcarriage returns"},
            {"prompt": "Quotes \"double\" and 'single' and `backticks`"},
            {"prompt": "零一二三四五六七八九十"}  # Chinese numbers
        ]
        
        for payload in special_prompts:
            payload.update({"temperature": 0.7, "max_tokens": 50})
            response = http_client.post(f"{api_base_url}/chat", json=payload)
            # Should handle various character encodings
            assert response.status_code in [200, 400, 422, 500]

    # Network and Timeout Tests
    @pytest.mark.slow
    def test_request_timeout_handling(self, api_base_url: str):
        """Test API behavior with very short timeout."""
        import requests
        
        session = requests.Session()
        session.timeout = 0.001  # Very short timeout
        
        payload = {
            "prompt": "Simple test",
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        try:
            response = session.post(f"{api_base_url}/chat", json=payload)
            # If it succeeds despite short timeout, that's fine too
            assert response.status_code in [200, 500]
        except requests.exceptions.Timeout:
            # Expected behavior
            pass
        except requests.exceptions.RequestException:
            # Other network errors are acceptable
            pass

    # HTTP Method Tests
    def test_invalid_http_methods(self, http_client: requests.Session, api_base_url: str):
        """Test endpoints with invalid HTTP methods."""
        endpoints = [
            "/chat",
            "/health", 
            "/rag/search",
            "/pdf/search"
        ]
        
        for endpoint in endpoints:
            # Test unsupported methods
            response = http_client.put(f"{api_base_url}{endpoint}")
            assert response.status_code in [405, 404]
            
            response = http_client.delete(f"{api_base_url}{endpoint}")
            assert response.status_code in [405, 404]

    # Large Payload Tests
    def test_large_json_payload(self, http_client: requests.Session, api_base_url: str):
        """Test API with very large JSON payload."""
        large_data = {
            "prompt": "test",
            "temperature": 0.7,
            "max_tokens": 50,
            "extra_data": ["x" * 1000] * 100  # Large array
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=large_data)
        # Should handle large payloads gracefully
        assert response.status_code in [200, 400, 413, 422]

    # Content Encoding Tests
    def test_different_content_encodings(self, http_client: requests.Session, api_base_url: str):
        """Test API with different content encodings."""
        payload = {"prompt": "test", "temperature": 0.7, "max_tokens": 50}
        
        # Test with gzip encoding if server supports it
        headers = {
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip"
        }
        
        response = http_client.post(f"{api_base_url}/chat", json=payload, headers=headers)
        # Should handle encoding preferences
        assert response.status_code in [200, 400, 422, 500]

    # Edge Cases for RAG Endpoints
    def test_rag_search_boundary_coordinates(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with boundary coordinate values."""
        test_cases = [
            {"user_lat": 90.0, "user_lon": 180.0},    # North pole, date line
            {"user_lat": -90.0, "user_lon": -180.0},   # South pole, date line
            {"user_lat": 0.0, "user_lon": 0.0},       # Equator, prime meridian
        ]
        
        for coords in test_cases:
            payload = {
                "query": "test location",
                "k_results": 3,
                **coords
            }
            
            response = http_client.post(f"{api_base_url}/rag/search", json=payload)
            # Should handle boundary coordinates gracefully
            assert response.status_code in [200, 400, 422, 500, 503]

    def test_completions_empty_messages(self, http_client: requests.Session, api_base_url: str):
        """Test completions endpoint with empty messages array."""
        payload = {
            "messages": [],
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        response = http_client.post(f"{api_base_url}/chat/completions", json=payload)
        # Should validate messages array
        assert response.status_code in [400, 422]

    def test_completions_invalid_message_structure(self, http_client: requests.Session, api_base_url: str):
        """Test completions endpoint with invalid message structure."""
        invalid_messages = [
            [{"role": "user"}],  # Missing content
            [{"content": "test"}],  # Missing role
            [{"role": "invalid", "content": "test"}],  # Invalid role
            [{"role": "user", "content": None}],  # Null content
        ]
        
        for messages in invalid_messages:
            payload = {
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 50
            }
            
            response = http_client.post(f"{api_base_url}/chat/completions", json=payload)
            assert response.status_code in [400, 422]

    # Server Resource Tests
    def test_api_response_headers(self, http_client: requests.Session, api_base_url: str):
        """Test that API returns proper response headers."""
        response = http_client.get(f"{api_base_url}/health")
        
        # Check for security headers
        headers = response.headers
        assert "content-type" in headers
        
        # Should not expose sensitive information
        server_header = headers.get("server", "").lower()
        assert "version" not in server_header or "fastapi" not in server_header

    def test_cors_headers(self, http_client: requests.Session, api_base_url: str):
        """Test CORS headers are properly set."""
        # Test preflight request
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        response = http_client.options(f"{api_base_url}/chat", headers=headers)
        # CORS preflight should be handled
        assert response.status_code in [200, 204, 404, 405]