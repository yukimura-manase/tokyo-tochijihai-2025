#!/usr/bin/env python3
"""
Test script for Evacuation RAG API endpoints
"""

import requests
import json
from typing import Optional, Dict, Any

BASE_URL = "http://localhost:8000"

def test_rag_status():
    """Test RAG system status."""
    print("=== Testing RAG Status ===")
    response = requests.get(f"{BASE_URL}/rag/status")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    print()

def test_rag_search(
    query: str,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    municipality: Optional[str] = None,
    filter_barrier_free: bool = False,
    filter_hazard: Optional[str] = None
):
    """Test RAG search endpoint."""
    print(f"=== Testing RAG Search: {query} ===")
    
    payload = {
        "query": query,
        "k_results": 5
    }
    
    if user_lat is not None and user_lon is not None:
        payload["user_lat"] = user_lat
        payload["user_lon"] = user_lon
        print(f"Location: ({user_lat}, {user_lon})")
    
    if municipality:
        payload["municipality"] = municipality
        print(f"Municipality filter: {municipality}")
    
    if filter_barrier_free:
        payload["filter_barrier_free"] = True
        print("Filtering for barrier-free facilities")
    
    if filter_hazard:
        payload["filter_hazard"] = filter_hazard
        print(f"Filtering for hazard: {filter_hazard}")
    
    response = requests.post(
        f"{BASE_URL}/rag/search",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nAnswer:\n{data['answer']}\n")
        print(f"Total results: {data['total_results']}")
        print("\nSources:")
        for i, source in enumerate(data['sources'], 1):
            print(f"\n{i}. {source.get('facility', '不明')}")
            print(f"   住所: {source.get('address', '不明')}")
            print(f"   自治体: {source.get('municipality', '不明')}")
            if source.get('distance_km') is not None:
                print(f"   距離: {source['distance_km']} km")
            if source.get('phone'):
                print(f"   電話: {source['phone']}")
            if source.get('is_barrier_free'):
                print("   バリアフリー: ○")
            if source.get('hazards'):
                print(f"   対応災害: {', '.join(source['hazards'])}")
    else:
        print(f"Error: {response.text}")
    
    print("\n" + "="*50 + "\n")

def main():
    """Run all tests."""
    # Test 1: Check RAG status
    test_rag_status()
    
    # Test 2: Basic search without location
    test_rag_search("避難所を教えて")
    
    # Test 3: Search with location (Tokyo Station area)
    test_rag_search(
        "近くの避難所を教えて",
        user_lat=35.681,
        user_lon=139.767
    )
    
    # Test 4: Search for barrier-free facilities
    test_rag_search(
        "車椅子対応の避難所",
        user_lat=35.681,
        user_lon=139.767,
        filter_barrier_free=True
    )
    
    # Test 5: Search with municipality filter
    test_rag_search(
        "避難所を探しています",
        municipality="千代田区"
    )
    
    # Test 6: Search for specific hazard type
    test_rag_search(
        "地震に対応した避難所",
        user_lat=35.681,
        user_lon=139.767,
        filter_hazard="earthquake"
    )

if __name__ == "__main__":
    main()