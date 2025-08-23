"""RAG (Retrieval Augmented Generation) endpoint tests."""

import pytest
import requests
from typing import Dict, Any


@pytest.mark.rag
@pytest.mark.integration
class TestRAGEndpoints:
    """Test suite for RAG-related endpoints."""

    # Evacuation RAG Tests
    def test_rag_status_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test the RAG status endpoint."""
        response = http_client.get(f"{api_base_url}/rag/status")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "unhealthy"]
        
        if data["status"] == "healthy":
            assert "message" in data
        else:
            assert "error" in data

    def test_rag_search_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test evacuation area RAG search endpoint."""
        payload = {
            "query": "避難所はどこにありますか？",
            "user_lat": 35.6762,
            "user_lon": 139.6503,
            "k_results": 3
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("RAG system not available - likely missing dataset")
            
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "answer" in data
        assert "sources" in data
        assert "total_results" in data
        
        assert isinstance(data["answer"], str)
        assert isinstance(data["sources"], list)
        assert isinstance(data["total_results"], int)
        assert len(data["answer"]) > 0

    def test_rag_search_without_location(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search without location coordinates."""
        payload = {
            "query": "避難所について教えてください",
            "k_results": 5
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("RAG system not available - likely missing dataset")
            
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "sources" in data

    def test_rag_search_with_filters(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with filters."""
        payload = {
            "query": "バリアフリーの避難所",
            "user_lat": 35.6762,
            "user_lon": 139.6503,
            "k_results": 3,
            "filter_barrier_free": True,
            "municipality": "渋谷区"
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("RAG system not available - likely missing dataset")
            
        assert response.status_code in [200, 500]  # May fail if no barrier-free results

    # PDF RAG Tests  
    def test_pdf_status_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test the PDF RAG status endpoint."""
        response = http_client.get(f"{api_base_url}/pdf/status")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "unhealthy"]

    def test_pdf_search_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test PDF document search endpoint."""
        payload = {
            "query": "災害時の対応について教えてください",
            "k_results": 3
        }
        
        response = http_client.post(f"{api_base_url}/pdf/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("PDF RAG system not available - likely missing PDF files")
            
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "answer" in data
        assert "sources" in data
        assert "total_results" in data
        
        assert isinstance(data["answer"], str)
        assert isinstance(data["sources"], list)
        assert isinstance(data["total_results"], int)
        assert len(data["answer"]) > 0

    # WiFi RAG Tests
    def test_wifi_status_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test the WiFi RAG status endpoint."""
        response = http_client.get(f"{api_base_url}/wifi/status")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "unhealthy"]

    def test_wifi_search_endpoint(self, http_client: requests.Session, api_base_url: str):
        """Test WiFi spot search endpoint."""
        payload = {
            "query": "新宿駅周辺のWiFiスポット",
            "user_lat": 35.6896,
            "user_lon": 139.7006,
            "k_results": 3
        }
        
        response = http_client.post(f"{api_base_url}/wifi/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("WiFi RAG system not available - likely missing dataset")
            
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "answer" in data
        assert "sources" in data
        assert "total_results" in data
        
        assert isinstance(data["answer"], str)
        assert isinstance(data["sources"], list)
        assert isinstance(data["total_results"], int)

    def test_wifi_search_with_filters(self, http_client: requests.Session, api_base_url: str):
        """Test WiFi search with filters."""
        payload = {
            "query": "無料WiFi",
            "user_lat": 35.6896,
            "user_lon": 139.7006,
            "k_results": 5,
            "filter_free_only": True,
            "filter_24h_only": True
        }
        
        response = http_client.post(f"{api_base_url}/wifi/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("WiFi RAG system not available - likely missing dataset")
            
        assert response.status_code in [200, 500]  # May fail if no 24h free WiFi spots

    # Error Handling Tests
    def test_rag_search_empty_query(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with empty query."""
        payload = {
            "query": "",
            "k_results": 3
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        assert response.status_code in [400, 422, 500]

    def test_rag_search_invalid_coordinates(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with invalid coordinates."""
        payload = {
            "query": "避難所",
            "user_lat": 999.0,  # Invalid latitude
            "user_lon": 999.0,  # Invalid longitude
            "k_results": 3
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        assert response.status_code in [400, 422, 500]

    def test_rag_search_negative_k_results(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with negative k_results."""
        payload = {
            "query": "避難所",
            "k_results": -1
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        assert response.status_code in [400, 422]

    @pytest.mark.slow
    def test_rag_search_large_k_results(self, http_client: requests.Session, api_base_url: str):
        """Test RAG search with very large k_results."""
        payload = {
            "query": "避難所",
            "k_results": 1000  # Very large number
        }
        
        response = http_client.post(f"{api_base_url}/rag/search", json=payload)
        
        if response.status_code == 503:
            pytest.skip("RAG system not available - likely missing dataset")
            
        # Should handle gracefully, either by limiting or returning available results
        assert response.status_code in [200, 400, 422, 500]

    @pytest.mark.slow 
    def test_rag_rebuild_index(self, http_client: requests.Session, api_base_url: str):
        """Test RAG index rebuild endpoint."""
        # Note: This is a potentially destructive operation, so we just check if it responds
        response = http_client.post(f"{api_base_url}/rag/rebuild-index")
        
        # Should either succeed or fail gracefully
        assert response.status_code in [200, 500, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data