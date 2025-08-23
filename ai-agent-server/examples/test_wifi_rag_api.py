#!/usr/bin/env python3
"""
WiFi RAG API Test Script

Tests the WiFi spot search functionality of the RAG API.
"""

import requests
import json
import sys
from typing import Dict, Any

# API base URL
BASE_URL = "http://localhost:8000"


def test_wifi_status() -> Dict[str, Any]:
    """Test WiFi RAG system status."""
    print("=== Testing WiFi RAG Status ===")
    
    try:
        response = requests.get(f"{BASE_URL}/wifi/status")
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        return data
    except Exception as e:
        print(f"Error testing WiFi status: {e}")
        return {}


def test_wifi_search_basic() -> Dict[str, Any]:
    """Test basic WiFi search without location."""
    print("\n=== Testing Basic WiFi Search ===")
    
    payload = {
        "query": "無料のWiFiスポットを教えて",
        "k_results": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/wifi/search",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Query: {payload['query']}")
        print(f"Answer: {data.get('answer', 'No answer')}")
        print(f"Total Results: {data.get('total_results', 0)}")
        
        sources = data.get('sources', [])
        print(f"\nSources ({len(sources)}):")
        for i, source in enumerate(sources[:3], 1):  # Show first 3
            facility = source.get('facility_name', 'Unknown')
            address = source.get('address', 'No address')
            is_free = "○" if source.get('is_free', False) else "×"
            print(f"  {i}. {facility}")
            print(f"     住所: {address}")
            print(f"     無料: {is_free}")
        
        return data
    except Exception as e:
        print(f"Error testing basic WiFi search: {e}")
        return {}


def test_wifi_search_with_location() -> Dict[str, Any]:
    """Test WiFi search with location (Tokyo Station area)."""
    print("\n=== Testing WiFi Search with Location ===")
    
    # Tokyo Station coordinates
    tokyo_station_lat = 35.6812
    tokyo_station_lon = 139.7671
    
    payload = {
        "query": "東京駅付近の24時間利用できるWiFiスポット",
        "user_lat": tokyo_station_lat,
        "user_lon": tokyo_station_lon,
        "k_results": 5,
        "filter_24h_only": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/wifi/search",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Query: {payload['query']}")
        print(f"Location: ({tokyo_station_lat}, {tokyo_station_lon})")
        print(f"Answer: {data.get('answer', 'No answer')}")
        print(f"Total Results: {data.get('total_results', 0)}")
        
        sources = data.get('sources', [])
        print(f"\nSources with Distance ({len(sources)}):")
        for i, source in enumerate(sources[:3], 1):  # Show first 3
            facility = source.get('facility_name', 'Unknown')
            address = source.get('address', 'No address')
            distance = source.get('distance_km', 'Unknown')
            is_24h = "○" if source.get('is_24h', False) else "×"
            print(f"  {i}. {facility}")
            print(f"     住所: {address}")
            print(f"     距離: {distance} km")
            print(f"     24時間: {is_24h}")
        
        return data
    except Exception as e:
        print(f"Error testing WiFi search with location: {e}")
        return {}


def test_wifi_search_filtered() -> Dict[str, Any]:
    """Test WiFi search with filters."""
    print("\n=== Testing WiFi Search with Filters ===")
    
    payload = {
        "query": "千代田区の無料WiFi",
        "municipality": "千代田区",
        "filter_free_only": True,
        "k_results": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/wifi/search",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Query: {payload['query']}")
        print(f"Municipality Filter: {payload['municipality']}")
        print(f"Free Only: {payload['filter_free_only']}")
        print(f"Answer: {data.get('answer', 'No answer')}")
        print(f"Total Results: {data.get('total_results', 0)}")
        
        sources = data.get('sources', [])
        print(f"\nFiltered Sources ({len(sources)}):")
        for i, source in enumerate(sources[:3], 1):  # Show first 3
            facility = source.get('facility_name', 'Unknown')
            municipality = source.get('municipality', 'Unknown')
            provider = source.get('provider', 'Unknown')
            is_free = "○" if source.get('is_free', False) else "×"
            print(f"  {i}. {facility}")
            print(f"     自治体: {municipality}")
            print(f"     事業者: {provider}")
            print(f"     無料: {is_free}")
        
        return data
    except Exception as e:
        print(f"Error testing filtered WiFi search: {e}")
        return {}


def test_wifi_rebuild_index() -> Dict[str, Any]:
    """Test WiFi index rebuild (optional, as it takes time)."""
    print("\n=== Testing WiFi Index Rebuild (Optional) ===")
    print("Note: This operation may take several minutes...")
    
    user_input = input("Do you want to rebuild the WiFi index? (y/N): ")
    if user_input.lower() not in ['y', 'yes']:
        print("Skipping index rebuild.")
        return {}
    
    try:
        response = requests.post(f"{BASE_URL}/wifi/rebuild-index")
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        return data
    except Exception as e:
        print(f"Error rebuilding WiFi index: {e}")
        return {}


def main():
    """Run all WiFi RAG tests."""
    print("WiFi RAG API Test Suite")
    print("=" * 50)
    
    # Test status first
    status_result = test_wifi_status()
    if status_result.get('status') != 'healthy':
        print("WiFi RAG system is not healthy. Exiting tests.")
        sys.exit(1)
    
    # Run search tests
    test_wifi_search_basic()
    test_wifi_search_with_location()
    test_wifi_search_filtered()
    
    # Optional index rebuild
    test_wifi_rebuild_index()
    
    print("\n=== All WiFi RAG Tests Completed ===")


if __name__ == "__main__":
    main()