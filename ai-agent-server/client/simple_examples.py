#!/usr/bin/env python3
"""
Simple Usage Examples for RAG Client
Quick and easy examples to get started with the RAG systems.
"""

import sys
import os

# Add the client directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_client import UnifiedRAGClient


def simple_evacuation_search():
    """最も基本的な避難所検索の例"""
    print("🏠 避難所を検索します...")
    
    client = UnifiedRAGClient()
    
    try:
        # 東京駅周辺の避難所を検索
        result = client.evacuation.search(
            query="最寄りの避難所を教えて",
            user_lat=35.681,  # 東京駅
            user_lon=139.767,
            k_results=3
        )
        
        print(f"✅ {result.total_results}件の避難所が見つかりました")
        print(f"回答: {result.answer}")
        print("\n避難所リスト:")
        
        for i, source in enumerate(result.sources, 1):
            facility = source.get('facility', '不明')
            address = source.get('address', '不明')
            distance = source.get('distance_km')
            distance_text = f" ({distance}km)" if distance else ""
            
            print(f"{i}. {facility}{distance_text}")
            print(f"   住所: {address}")
        
    except Exception as e:
        print(f"❌ エラー: {e}")


def simple_pdf_search():
    """最も基本的な防災計画検索の例"""
    print("\n📚 防災計画を検索します...")
    
    client = UnifiedRAGClient()
    
    try:
        result = client.pdf.search(
            query="避難所の設営について教えて",
            k_results=3
        )
        
        print(f"✅ {result.total_results}件の関連文書が見つかりました")
        print(f"回答: {result.answer}")
        print("\n参照文書:")
        
        for i, source in enumerate(result.sources, 1):
            source_name = source.get('source', '不明')
            page = source.get('page', '不明')
            page_text = f" (ページ: {page + 1})" if page != '不明' else ""
            content = source.get('content', '')[:80] + "..." if source.get('content', '') else "内容なし"
            
            print(f"{i}. {source_name}{page_text}")
            print(f"   内容: {content}")
        
    except Exception as e:
        print(f"❌ エラー: {e}")


def simple_wifi_search():
    """最も基本的なWiFi検索の例"""
    print("\n📶 WiFiスポットを検索します...")
    
    client = UnifiedRAGClient()
    
    try:
        result = client.wifi.search(
            query="無料のWiFiスポットを探している",
            user_lat=35.681,  # 東京駅
            user_lon=139.767,
            filter_free_only=True,
            k_results=3
        )
        
        print(f"✅ {result.total_results}件のWiFiスポットが見つかりました")
        print(f"回答: {result.answer}")
        print("\nWiFiスポット:")
        
        for i, source in enumerate(result.sources, 1):
            spot_name = source.get('spot_name', '不明')
            provider = source.get('provider', '不明')
            distance = source.get('distance_km')
            distance_text = f" ({distance}km)" if distance else ""
            
            print(f"{i}. {spot_name}{distance_text}")
            print(f"   提供者: {provider}")
        
    except Exception as e:
        print(f"❌ エラー: {e}")


def check_system_status():
    """システム状態の確認"""
    print("\n🔍 システム状態を確認します...")
    
    client = UnifiedRAGClient()
    
    try:
        # サーバーの健康状態をチェック
        health = client.evacuation.check_health()
        if health.get('status') == 'healthy':
            print("✅ サーバーは正常に動作しています")
        else:
            print("❌ サーバーに問題があります")
            return
        
        # 各システムの状態をチェック
        systems = [
            ("避難所RAG", client.evacuation.get_status),
            ("防災計画RAG", client.pdf.get_status),
            ("WiFi RAG", client.wifi.get_status),
        ]
        
        for system_name, get_status in systems:
            try:
                status = get_status()
                if status.get('status') == 'healthy':
                    print(f"✅ {system_name}: 正常")
                else:
                    print(f"❌ {system_name}: {status.get('status', '不明')}")
            except Exception as e:
                print(f"❌ {system_name}: エラー ({e})")
        
    except Exception as e:
        print(f"❌ システムチェックエラー: {e}")


def combined_search_example():
    """複合検索の例"""
    print("\n🔄 複合検索を実行します...")
    
    client = UnifiedRAGClient()
    
    try:
        # 地震に関する包括的な情報を検索
        query = "地震が起きた時の対応方法"
        user_lat = 35.681  # 東京駅
        user_lon = 139.767
        
        print(f"検索クエリ: '{query}'")
        print(f"現在地: 東京駅周辺")
        
        results = client.search_combined(
            query=query,
            user_lat=user_lat,
            user_lon=user_lon,
            include_systems=["evacuation", "pdf"]
        )
        
        # 避難所情報
        if "evacuation" in results:
            evac_result = results["evacuation"]
            print(f"\n🏠 避難所情報 ({evac_result.total_results}件):")
            for i, source in enumerate(evac_result.sources[:2], 1):
                facility = source.get('facility', '不明')
                distance = source.get('distance_km', '不明')
                print(f"  {i}. {facility} ({distance}km)")
        
        # 防災計画情報
        if "pdf" in results:
            pdf_result = results["pdf"]
            print(f"\n📚 防災計画情報:")
            print(f"回答: {pdf_result.answer[:200]}...")
        
    except Exception as e:
        print(f"❌ 複合検索エラー: {e}")


if __name__ == "__main__":
    print("Tokyo Disaster Response RAG - Simple Examples")
    print("=" * 50)
    
    # サーバーが起動しているかチェック
    print("サーバー接続を確認中...")
    client = UnifiedRAGClient()
    if not client.wait_for_all_systems(max_wait=10):
        print("❌ サーバーに接続できません")
        print("docker-compose up でサーバーを起動してください")
        sys.exit(1)
    
    print("✅ サーバー接続成功!")
    
    # 各機能のデモを実行
    check_system_status()
    simple_evacuation_search()
    simple_pdf_search() 
    simple_wifi_search()
    combined_search_example()
    
    print("\n🎉 デモ完了!")
    print("\nさらに詳しい使用例は usage_examples.py を参照してください。")