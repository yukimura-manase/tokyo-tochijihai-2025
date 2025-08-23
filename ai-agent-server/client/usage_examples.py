#!/usr/bin/env python3
"""
Usage Examples for Tokyo Disaster Response RAG Client
Demonstrates how to use the RAG client to search across different systems.
"""

import sys
import os
from typing import Optional

# Add the client directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_client import UnifiedRAGClient, EvacuationRAG, PDFRAG, WiFiRAG


def example_basic_usage():
    """Basic usage example for each RAG system."""
    print("=" * 60)
    print("BASIC USAGE EXAMPLES")
    print("=" * 60)
    
    # Initialize clients
    client = UnifiedRAGClient()
    
    # Wait for server to be ready
    print("Waiting for server to be ready...")
    if not client.wait_for_all_systems(max_wait=30):
        print("❌ Server not available. Please start the server first.")
        return
    
    print("✅ Server is ready!\n")
    
    # Example 1: Evacuation shelter search
    print("1. 避難所検索の例")
    try:
        result = client.evacuation.search(
            query="車椅子対応の避難所を教えて",
            user_lat=35.681,  # Tokyo Station
            user_lon=139.767,
            filter_barrier_free=True,
            k_results=3
        )
        result.print_summary()
    except Exception as e:
        print(f"❌ Evacuation search failed: {e}\n")
    
    # Example 2: PDF document search
    print("\n2. 防災計画文書検索の例")
    try:
        result = client.pdf.search(
            query="避難所の設営手順について教えて",
            k_results=3
        )
        result.print_summary()
    except Exception as e:
        print(f"❌ PDF search failed: {e}\n")
    
    # Example 3: WiFi spot search
    print("\n3. WiFiスポット検索の例")
    try:
        result = client.wifi.search(
            query="無料のWiFiスポットを探している",
            user_lat=35.681,
            user_lon=139.767,
            filter_free_only=True,
            k_results=3
        )
        result.print_summary()
    except Exception as e:
        print(f"❌ WiFi search failed: {e}\n")


def example_location_based_search():
    """Location-based search examples."""
    print("=" * 60)
    print("LOCATION-BASED SEARCH EXAMPLES")
    print("=" * 60)
    
    client = UnifiedRAGClient()
    
    # Tokyo landmarks for testing
    locations = [
        {"name": "東京駅", "lat": 35.681, "lon": 139.767},
        {"name": "新宿駅", "lat": 35.690, "lon": 139.700},
        {"name": "渋谷駅", "lat": 35.658, "lon": 139.701},
    ]
    
    for location in locations:
        print(f"\n📍 {location['name']}周辺の検索")
        
        # Search for nearby evacuation shelters
        try:
            result = client.evacuation.search(
                query="最寄りの避難所",
                user_lat=location["lat"],
                user_lon=location["lon"],
                k_results=2
            )
            print(f"避難所検索結果: {result.total_results}件")
            for i, source in enumerate(result.sources[:2], 1):
                facility = source.get('facility', 'Unknown')
                distance = source.get('distance_km', 'Unknown')
                print(f"  {i}. {facility} ({distance}km)")
        except Exception as e:
            print(f"❌ {location['name']}の避難所検索失敗: {e}")
        
        # Search for nearby WiFi spots
        try:
            result = client.wifi.search(
                query="近くのWiFi",
                user_lat=location["lat"],
                user_lon=location["lon"],
                k_results=2
            )
            print(f"WiFi検索結果: {result.total_results}件")
            for i, source in enumerate(result.sources[:2], 1):
                spot_name = source.get('spot_name', 'Unknown')
                distance = source.get('distance_km', 'Unknown')
                print(f"  {i}. {spot_name} ({distance}km)")
        except Exception as e:
            print(f"❌ {location['name']}のWiFi検索失敗: {e}")


def example_combined_search():
    """Combined search across multiple systems."""
    print("=" * 60)
    print("COMBINED SEARCH EXAMPLES")
    print("=" * 60)
    
    client = UnifiedRAGClient()
    
    # Example: Comprehensive disaster preparation search
    query = "地震発生時の対応"
    user_lat = 35.681  # Tokyo Station
    user_lon = 139.767
    
    print(f"検索クエリ: '{query}'")
    print(f"位置: 東京駅周辺 ({user_lat}, {user_lon})\n")
    
    try:
        results = client.search_combined(
            query=query,
            user_lat=user_lat,
            user_lon=user_lon,
            include_systems=["evacuation", "pdf", "wifi"]
        )
        
        print("🏢 避難所情報:")
        if "evacuation" in results:
            evac_result = results["evacuation"]
            print(f"  見つかった避難所: {evac_result.total_results}件")
            for source in evac_result.sources[:2]:
                facility = source.get('facility', 'Unknown')
                distance = source.get('distance_km', 'Unknown')
                print(f"  • {facility} ({distance}km)")
        else:
            print("  ❌ 避難所情報を取得できませんでした")
        
        print("\n📚 防災計画情報:")
        if "pdf" in results:
            pdf_result = results["pdf"]
            print(f"  関連文書: {pdf_result.total_results}件")
            print(f"  回答: {pdf_result.answer[:100]}...")
        else:
            print("  ❌ 防災計画情報を取得できませんでした")
        
        print("\n📶 WiFi情報:")
        if "wifi" in results:
            wifi_result = results["wifi"]
            print(f"  WiFiスポット: {wifi_result.total_results}件")
            for source in wifi_result.sources[:2]:
                spot_name = source.get('spot_name', 'Unknown')
                distance = source.get('distance_km', 'Unknown')
                print(f"  • {spot_name} ({distance}km)")
        else:
            print("  ❌ WiFi情報を取得できませんでした")
            
    except Exception as e:
        print(f"❌ Combined search failed: {e}")


def example_filtering():
    """Examples of advanced filtering options."""
    print("=" * 60)
    print("ADVANCED FILTERING EXAMPLES")
    print("=" * 60)
    
    client = UnifiedRAGClient()
    
    # Example 1: Barrier-free evacuation shelters
    print("1. バリアフリー対応避難所の検索")
    try:
        result = client.evacuation.search(
            query="車椅子利用者向けの避難所",
            user_lat=35.681,
            user_lon=139.767,
            filter_barrier_free=True,
            municipality="千代田区",
            k_results=3
        )
        print(f"見つかった施設: {result.total_results}件")
        for source in result.sources:
            facility = source.get('facility', 'Unknown')
            address = source.get('address', 'Unknown')
            barrier_free = source.get('is_barrier_free', False)
            print(f"• {facility} ({'バリアフリー' if barrier_free else '情報なし'})")
            print(f"  {address}")
    except Exception as e:
        print(f"❌ Barrier-free search failed: {e}")
    
    # Example 2: Free WiFi spots only
    print("\n2. 無料WiFiスポットのみの検索")
    try:
        result = client.wifi.search(
            query="無料WiFi",
            user_lat=35.681,
            user_lon=139.767,
            filter_free_only=True,
            filter_24h_only=False,
            k_results=3
        )
        print(f"見つかったスポット: {result.total_results}件")
        for source in result.sources:
            spot_name = source.get('spot_name', 'Unknown')
            provider = source.get('provider', 'Unknown')
            is_free = source.get('is_free', False)
            print(f"• {spot_name} ({'無料' if is_free else '有料'}) - {provider}")
    except Exception as e:
        print(f"❌ Free WiFi search failed: {e}")
    
    # Example 3: Specific hazard type evacuation shelters
    print("\n3. 特定災害対応避難所の検索")
    hazard_types = ["earthquake", "flood", "tsunami"]
    
    for hazard in hazard_types:
        try:
            result = client.evacuation.search(
                query=f"{hazard}に対応した避難所",
                user_lat=35.681,
                user_lon=139.767,
                filter_hazard=hazard,
                k_results=2
            )
            hazard_jp = {"earthquake": "地震", "flood": "洪水", "tsunami": "津波"}.get(hazard, hazard)
            print(f"  {hazard_jp}対応施設: {result.total_results}件")
        except Exception as e:
            print(f"  ❌ {hazard}対応施設検索失敗: {e}")


def example_system_status():
    """System status checking examples."""
    print("=" * 60)
    print("SYSTEM STATUS EXAMPLES")
    print("=" * 60)
    
    client = UnifiedRAGClient()
    
    # Check overall health
    print("🔍 システム全体の状態チェック")
    try:
        statuses = client.check_all_systems()
        
        for system_name, status in statuses.items():
            system_status = status.get('status', 'unknown')
            if system_status == 'healthy':
                print(f"✅ {system_name.upper()}: {system_status}")
            else:
                print(f"❌ {system_name.upper()}: {system_status}")
                if 'error' in status:
                    print(f"   Error: {status['error']}")
    except Exception as e:
        print(f"❌ Status check failed: {e}")
    
    # Individual system details
    print("\n📊 各システムの詳細情報")
    
    systems = [
        ("evacuation", "避難所RAG", client.evacuation),
        ("pdf", "防災計画RAG", client.pdf),
        ("wifi", "WiFiRAG", client.wifi),
    ]
    
    for system_id, system_name, system_client in systems:
        try:
            status = system_client.get_status()
            print(f"\n{system_name}:")
            if status.get('status') == 'healthy':
                print(f"  ✅ Status: {status.get('status')}")
                if 'csv_path' in status:
                    print(f"  📁 Data: {status.get('csv_path', 'N/A')}")
                if 'pdf_path' in status:
                    print(f"  📄 PDF: {status.get('pdf_path', 'N/A')}")
                if 'excel_path' in status:
                    print(f"  📊 Excel: {status.get('excel_path', 'N/A')}")
                print(f"  🗃️  Vector DB: {status.get('persist_dir', 'N/A')}")
                print(f"  🤖 AI: {'OpenAI' if status.get('use_openai') else 'Local'}")
            else:
                print(f"  ❌ Status: {status.get('status')}")
                if 'error' in status:
                    print(f"  Error: {status['error']}")
        except Exception as e:
            print(f"\n{system_name}:")
            print(f"  ❌ Error: {e}")


def main():
    """Run all examples."""
    print("Tokyo Disaster Response RAG Client Examples")
    print("=" * 60)
    
    examples = [
        ("Basic Usage", example_basic_usage),
        ("Location-Based Search", example_location_based_search),
        ("Combined Search", example_combined_search),
        ("Advanced Filtering", example_filtering),
        ("System Status", example_system_status),
    ]
    
    for name, example_func in examples:
        print(f"\n\n{'='*20} {name} {'='*20}")
        try:
            example_func()
        except KeyboardInterrupt:
            print("\n\n⏹️  Stopped by user")
            break
        except Exception as e:
            print(f"❌ Example '{name}' failed: {e}")
    
    print("\n\n🎉 Examples completed!")


if __name__ == "__main__":
    main()