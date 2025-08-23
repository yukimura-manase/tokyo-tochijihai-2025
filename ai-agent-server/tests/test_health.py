"""Health check and service availability tests."""

import pytest
import requests
from requests.exceptions import RequestException


@pytest.mark.health
@pytest.mark.integration
class TestHealthChecks:
    """Test suite for health checks and service availability."""

    def test_root_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test the root endpoint returns expected message."""
        response = http_client.get(f"{api_base_url}/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "AI Agent Server" in data["message"]

    def test_health_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test the health endpoint returns healthy status."""
        response = http_client.get(f"{api_base_url}/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "status" in data
        assert "model" in data
        assert "ollama_connection" in data
        
        # Check values
        assert data["status"] == "healthy"
        assert data["ollama_connection"] == "ok"
        assert isinstance(data["model"], str)

    def test_health_endpoint_response_time(self, http_client: requests.Session, api_base_url: str):
        """Test that health endpoint responds within reasonable time."""
        import time
        
        start_time = time.time()
        response = http_client.get(f"{api_base_url}/health")
        response_time = time.time() - start_time
        
        assert response.status_code == 200
        assert response_time < 10.0  # Should respond within 10 seconds

    def test_health_endpoint_headers(self, http_client: requests.Session, api_base_url: str):
        """Test that health endpoint returns proper headers."""
        response = http_client.get(f"{api_base_url}/health")
        
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")

    @pytest.mark.slow
    def test_multiple_health_checks(self, http_client: requests.Session, api_base_url: str):
        """Test multiple consecutive health checks for consistency."""
        results = []
        
        for i in range(5):
            response = http_client.get(f"{api_base_url}/health")
            results.append(response.status_code == 200)
        
        # All requests should succeed
        assert all(results), "Not all health checks passed"

    def test_invalid_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test that invalid endpoints return 404."""
        response = http_client.get(f"{api_base_url}/nonexistent")
        assert response.status_code == 404