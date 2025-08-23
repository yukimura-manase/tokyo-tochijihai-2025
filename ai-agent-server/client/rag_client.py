#!/usr/bin/env python3
"""
RAG Client for Tokyo Disaster Response System
Python requests client to interact with all RAG systems (evacuation, PDF, WiFi).
"""

import requests
import json
import time
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass


@dataclass
class RAGResponse:
    """Standard response format for RAG searches."""
    answer: str
    sources: List[Dict[str, Any]]
    total_results: int
    system_type: str  # 'evacuation', 'pdf', or 'wifi'
    
    def print_summary(self):
        """Print a formatted summary of the response."""
        print(f"=== {self.system_type.upper()} RAG Results ===")
        print(f"Total Results: {self.total_results}")
        print(f"\nAnswer:\n{self.answer}\n")
        print("Sources:")
        for i, source in enumerate(self.sources, 1):
            if self.system_type == 'evacuation':
                facility = source.get('facility', 'Unknown')
                address = source.get('address', 'Unknown')
                distance = source.get('distance_km')
                distance_str = f" ({distance}km)" if distance else ""
                print(f"  {i}. {facility}{distance_str}")
                print(f"     {address}")
            elif self.system_type == 'pdf':
                source_name = source.get('source', 'Unknown')
                page = source.get('page', 'Unknown')
                page_str = f" (Page: {page + 1})" if page != 'Unknown' else ""
                content = source.get('content', '')[:100] + "..." if source.get('content', '') else ""
                print(f"  {i}. {source_name}{page_str}")
                print(f"     {content}")
            elif self.system_type == 'wifi':
                spot_name = source.get('spot_name', 'Unknown')
                address = source.get('address', 'Unknown')
                provider = source.get('provider', 'Unknown')
                distance = source.get('distance_km')
                distance_str = f" ({distance}km)" if distance else ""
                print(f"  {i}. {spot_name}{distance_str}")
                print(f"     Provider: {provider} | {address}")
        print("-" * 50)


class RAGClient:
    """
    Unified client for all RAG systems in the Tokyo Disaster Response System.
    
    Supports:
    - Evacuation shelter search (location-aware)
    - Disaster prevention PDF document search
    - WiFi spot search (location-aware)
    """
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 30, max_retries: int = 3):
        """
        Initialize RAG client.
        
        Args:
            base_url: Base URL of the RAG API server
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """
        Make HTTP request with retry logic.
        
        Args:
            method: HTTP method ('GET' or 'POST')
            endpoint: API endpoint (without base URL)
            **kwargs: Additional arguments for requests
            
        Returns:
            Response object
            
        Raises:
            requests.exceptions.RequestException: If all retries fail
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        kwargs['timeout'] = kwargs.get('timeout', self.timeout)
        
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                if method.upper() == 'GET':
                    response = self.session.get(url, **kwargs)
                elif method.upper() == 'POST':
                    response = self.session.post(url, **kwargs)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    time.sleep(1 * (attempt + 1))  # Exponential backoff
                continue
        
        raise last_exception
    
    def check_health(self) -> Dict[str, Any]:
        """
        Check if the API server is healthy.
        
        Returns:
            Health status information
        """
        try:
            response = self._make_request('GET', '/health')
            return response.json()
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    def wait_for_server(self, max_wait: int = 60) -> bool:
        """
        Wait for the server to become available.
        
        Args:
            max_wait: Maximum time to wait in seconds
            
        Returns:
            True if server becomes available, False otherwise
        """
        start_time = time.time()
        while time.time() - start_time < max_wait:
            health = self.check_health()
            if health.get("status") == "healthy":
                return True
            time.sleep(2)
        return False


class EvacuationRAG(RAGClient):
    """Client for evacuation shelter RAG system."""
    
    def search(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        k_results: int = 8,
        filter_barrier_free: bool = False,
        filter_hazard: Optional[str] = None
    ) -> RAGResponse:
        """
        Search for evacuation shelters.
        
        Args:
            query: Search query in natural language
            user_lat: User's latitude for distance calculation
            user_lon: User's longitude for distance calculation  
            municipality: Filter by municipality name (e.g., "千代田区")
            k_results: Number of results to return
            filter_barrier_free: Only return barrier-free facilities
            filter_hazard: Filter by hazard type ("flood", "earthquake", etc.)
            
        Returns:
            RAGResponse with evacuation shelter information
        """
        payload = {
            "query": query,
            "user_lat": user_lat,
            "user_lon": user_lon,
            "municipality": municipality,
            "k_results": k_results,
            "filter_barrier_free": filter_barrier_free,
            "filter_hazard": filter_hazard
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        response = self._make_request('POST', '/rag/search', json=payload)
        data = response.json()
        
        return RAGResponse(
            answer=data['answer'],
            sources=data['sources'],
            total_results=data['total_results'],
            system_type='evacuation'
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Get evacuation RAG system status."""
        response = self._make_request('GET', '/rag/status')
        return response.json()
    
    def rebuild_index(self) -> Dict[str, str]:
        """Rebuild the evacuation RAG index."""
        response = self._make_request('POST', '/rag/rebuild-index')
        return response.json()


class PDFRAG(RAGClient):
    """Client for disaster prevention PDF RAG system."""
    
    def search(self, query: str, k_results: int = 6) -> RAGResponse:
        """
        Search disaster prevention plan documents.
        
        Args:
            query: Search query in natural language
            k_results: Number of results to return
            
        Returns:
            RAGResponse with PDF document information
        """
        payload = {
            "query": query,
            "k_results": k_results
        }
        
        response = self._make_request('POST', '/pdf/search', json=payload)
        data = response.json()
        
        return RAGResponse(
            answer=data['answer'],
            sources=data['sources'],
            total_results=data['total_results'],
            system_type='pdf'
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Get PDF RAG system status."""
        response = self._make_request('GET', '/pdf/status')
        return response.json()
    
    def rebuild_index(self) -> Dict[str, str]:
        """Rebuild the PDF RAG index."""
        response = self._make_request('POST', '/pdf/rebuild-index')
        return response.json()


class WiFiRAG(RAGClient):
    """Client for WiFi spot RAG system."""
    
    def search(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        k_results: int = 8,
        filter_free_only: bool = False,
        filter_24h_only: bool = False,
        provider: Optional[str] = None
    ) -> RAGResponse:
        """
        Search for WiFi spots.
        
        Args:
            query: Search query in natural language
            user_lat: User's latitude for distance calculation
            user_lon: User's longitude for distance calculation
            municipality: Filter by municipality name
            k_results: Number of results to return
            filter_free_only: Only return free WiFi spots
            filter_24h_only: Only return 24-hour available spots
            provider: Filter by specific provider
            
        Returns:
            RAGResponse with WiFi spot information
        """
        payload = {
            "query": query,
            "user_lat": user_lat,
            "user_lon": user_lon,
            "municipality": municipality,
            "k_results": k_results,
            "filter_free_only": filter_free_only,
            "filter_24h_only": filter_24h_only,
            "provider": provider
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        response = self._make_request('POST', '/wifi/search', json=payload)
        data = response.json()
        
        return RAGResponse(
            answer=data['answer'],
            sources=data['sources'],
            total_results=data['total_results'],
            system_type='wifi'
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Get WiFi RAG system status."""
        response = self._make_request('GET', '/wifi/status')
        return response.json()
    
    def rebuild_index(self) -> Dict[str, str]:
        """Rebuild the WiFi RAG index."""
        response = self._make_request('POST', '/wifi/rebuild-index')
        return response.json()


class UnifiedRAGClient:
    """
    Unified interface for all RAG systems.
    Provides convenient access to evacuation, PDF, and WiFi RAG systems.
    """
    
    def __init__(self, base_url: str = "http://localhost:8000", **kwargs):
        """
        Initialize unified RAG client.
        
        Args:
            base_url: Base URL of the RAG API server
            **kwargs: Additional arguments passed to individual RAG clients
        """
        self.evacuation = EvacuationRAG(base_url, **kwargs)
        self.pdf = PDFRAG(base_url, **kwargs)
        self.wifi = WiFiRAG(base_url, **kwargs)
        self.base_url = base_url
    
    def check_all_systems(self) -> Dict[str, Dict[str, Any]]:
        """
        Check status of all RAG systems.
        
        Returns:
            Dictionary with status of each system
        """
        systems = {}
        
        try:
            systems['health'] = self.evacuation.check_health()
        except Exception as e:
            systems['health'] = {"status": "error", "error": str(e)}
        
        try:
            systems['evacuation'] = self.evacuation.get_status()
        except Exception as e:
            systems['evacuation'] = {"status": "error", "error": str(e)}
        
        try:
            systems['pdf'] = self.pdf.get_status()
        except Exception as e:
            systems['pdf'] = {"status": "error", "error": str(e)}
        
        try:
            systems['wifi'] = self.wifi.get_status()
        except Exception as e:
            systems['wifi'] = {"status": "error", "error": str(e)}
        
        return systems
    
    def wait_for_all_systems(self, max_wait: int = 60) -> bool:
        """
        Wait for all systems to become available.
        
        Args:
            max_wait: Maximum time to wait in seconds
            
        Returns:
            True if all systems become available, False otherwise
        """
        return self.evacuation.wait_for_server(max_wait)
    
    def search_combined(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        municipality: Optional[str] = None,
        include_systems: List[str] = ["evacuation", "pdf", "wifi"]
    ) -> Dict[str, RAGResponse]:
        """
        Search across multiple RAG systems simultaneously.
        
        Args:
            query: Search query
            user_lat: User's latitude
            user_lon: User's longitude
            municipality: Municipality filter
            include_systems: Which systems to search ("evacuation", "pdf", "wifi")
            
        Returns:
            Dictionary with results from each system
        """
        results = {}
        
        if "evacuation" in include_systems:
            try:
                results["evacuation"] = self.evacuation.search(
                    query=query,
                    user_lat=user_lat,
                    user_lon=user_lon,
                    municipality=municipality
                )
            except Exception as e:
                print(f"Evacuation search failed: {e}")
        
        if "pdf" in include_systems:
            try:
                results["pdf"] = self.pdf.search(query=query)
            except Exception as e:
                print(f"PDF search failed: {e}")
        
        if "wifi" in include_systems:
            try:
                results["wifi"] = self.wifi.search(
                    query=query,
                    user_lat=user_lat,
                    user_lon=user_lon,
                    municipality=municipality
                )
            except Exception as e:
                print(f"WiFi search failed: {e}")
        
        return results