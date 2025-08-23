#!/usr/bin/env python3
"""
Test script for PDF RAG API functionality.
Tests the disaster prevention plan PDF search capabilities.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_pdf_status():
    """Test PDF RAG system status."""
    print("=== Testing PDF RAG Status ===")
    response = requests.get(f"{BASE_URL}/pdf/status")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"PDF RAG Status: {data.get('status')}")
        print(f"PDF Path: {data.get('pdf_path')}")
        print(f"Persist Directory: {data.get('persist_dir')}")
        print(f"Chunk Size: {data.get('chunk_size')}")
        print(f"Vector Store Accessible: {data.get('vector_store_accessible')}")
    else:
        print(f"Error: {response.text}")
    print()

def test_pdf_search():
    """Test PDF search functionality with various queries."""
    print("=== Testing PDF RAG Search ===")
    
    # Test queries related to disaster prevention
    queries = [
        "避難所の設営について教えて",
        "地震発生時の初動対応",
        "災害対策本部の役割",
        "住民への情報伝達方法",
        "災害時の医療体制",
        "水害対応について"
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"Test {i}: {query}")
        
        payload = {
            "query": query,
            "k_results": 4
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/pdf/search",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success")
                print(f"Answer: {data['answer'][:200]}...")
                print(f"Sources found: {data['total_results']}")
                
                # Show first source details
                if data['sources']:
                    source = data['sources'][0]
                    print(f"Top source: {source.get('source', 'N/A')}, Page: {source.get('page', 'N/A')}")
                    print(f"Content preview: {source.get('content', 'N/A')[:100]}...")
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        print("-" * 50)
        time.sleep(1)  # Be nice to the server

def test_pdf_rebuild_index():
    """Test rebuilding the PDF index."""
    print("=== Testing PDF Index Rebuild ===")
    
    response = requests.post(f"{BASE_URL}/pdf/rebuild-index")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data.get('message')}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_combined_scenarios():
    """Test realistic combined scenarios."""
    print("=== Testing Combined Scenarios ===")
    
    scenarios = [
        {
            "name": "住民向け災害情報",
            "query": "住民に災害情報を伝える方法について詳しく教えて",
            "k_results": 5
        },
        {
            "name": "避難所運営",
            "query": "避難所を開設・運営する際の手順と注意点",
            "k_results": 6
        },
        {
            "name": "災害対策本部",
            "query": "災害対策本部の設置と各部署の役割分担",
            "k_results": 4
        }
    ]
    
    for scenario in scenarios:
        print(f"Scenario: {scenario['name']}")
        print(f"Query: {scenario['query']}")
        
        payload = {
            "query": scenario["query"],
            "k_results": scenario["k_results"]
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/pdf/search",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success - Found {data['total_results']} relevant sections")
                print(f"Response length: {len(data['answer'])} characters")
                
                # Show source diversity
                sources = data['sources']
                pages = set(s.get('page') for s in sources if s.get('page') is not None)
                print(f"Pages referenced: {sorted(list(pages))}")
                
            else:
                print(f"❌ Failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        print("-" * 60)
        time.sleep(1)

def main():
    """Run all tests."""
    print("PDF RAG API Test Suite")
    print("=" * 60)
    
    # Wait for server to be ready
    print("Waiting for server to be ready...")
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ Server is ready!")
                break
        except requests.exceptions.ConnectionError:
            pass
        
        if i == max_retries - 1:
            print("❌ Server not responding. Please start the server first.")
            return
        
        time.sleep(2)
    
    # Run tests
    test_pdf_status()
    test_pdf_search()
    test_combined_scenarios()
    
    # Optional: Test rebuild (uncomment if needed)
    # print("Note: Skipping rebuild test to preserve existing index")
    # print("Uncomment test_pdf_rebuild_index() call to test rebuilding")
    # test_pdf_rebuild_index()
    
    print("🎉 All tests completed!")

if __name__ == "__main__":
    main()