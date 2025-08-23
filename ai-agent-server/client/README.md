# Tokyo Disaster Response RAG Client

PythonのrequestsライブラリでTokyo Disaster Response RAGシステムを簡単に利用できるクライアントライブラリです。

## 概要

3つのRAGシステムにアクセスできます：
- **避難所RAG**: 位置情報を考慮した避難所検索
- **防災計画RAG**: 防災計画PDF文書からの情報検索
- **WiFi RAG**: WiFiスポットの検索

## インストール

```bash
pip install requests
```

## 基本的な使用方法

### 1. クライアントの初期化

```python
from rag_client import UnifiedRAGClient

# 統合クライアントを初期化
client = UnifiedRAGClient()

# 個別クライアントも使用可能
from rag_client import EvacuationRAG, PDFRAG, WiFiRAG
evac_client = EvacuationRAG()
pdf_client = PDFRAG()
wifi_client = WiFiRAG()
```

### 2. 避難所検索

```python
# 基本的な避難所検索
result = client.evacuation.search(
    query="最寄りの避難所を教えて",
    user_lat=35.681,  # 東京駅の緯度
    user_lon=139.767,  # 東京駅の経度
    k_results=5
)

print(result.answer)
for source in result.sources:
    facility = source['facility']
    distance = source['distance_km']
    print(f"- {facility} ({distance}km)")
```

### 3. 防災計画文書検索

```python
# 防災計画文書から情報を検索
result = client.pdf.search(
    query="避難所の設営手順について",
    k_results=4
)

print(result.answer)
for source in result.sources:
    source_name = source['source']
    page = source['page']
    print(f"- {source_name} (ページ: {page + 1})")
```

### 4. WiFiスポット検索

```python
# WiFiスポット検索
result = client.wifi.search(
    query="無料のWiFiスポットを探している",
    user_lat=35.681,
    user_lon=139.767,
    filter_free_only=True,
    k_results=5
)

print(result.answer)
for source in result.sources:
    spot_name = source['spot_name']
    provider = source['provider']
    print(f"- {spot_name} (提供: {provider})")
```

## 高度な使用方法

### 1. フィルタリング

```python
# バリアフリー対応避難所のみ検索
result = client.evacuation.search(
    query="車椅子対応の避難所",
    user_lat=35.681,
    user_lon=139.767,
    filter_barrier_free=True,
    municipality="千代田区"  # 特定の自治体に限定
)

# 特定の災害に対応した避難所
result = client.evacuation.search(
    query="地震対応避難所",
    filter_hazard="earthquake"  # earthquake, flood, tsunami, etc.
)

# 24時間利用可能な無料WiFi
result = client.wifi.search(
    query="24時間使えるWiFi",
    filter_free_only=True,
    filter_24h_only=True
)
```

### 2. 複合検索

```python
# 複数システムから同時に検索
results = client.search_combined(
    query="地震発生時の対応",
    user_lat=35.681,
    user_lon=139.767,
    include_systems=["evacuation", "pdf", "wifi"]
)

# 結果を個別に処理
if "evacuation" in results:
    evac_result = results["evacuation"]
    print(f"避難所: {evac_result.total_results}件")

if "pdf" in results:
    pdf_result = results["pdf"]
    print(f"防災計画: {pdf_result.answer}")

if "wifi" in results:
    wifi_result = results["wifi"]
    print(f"WiFi: {wifi_result.total_results}件")
```

### 3. システム状態の確認

```python
# 全システムの状態をチェック
statuses = client.check_all_systems()

for system_name, status in statuses.items():
    if status.get('status') == 'healthy':
        print(f"✅ {system_name}: 正常")
    else:
        print(f"❌ {system_name}: {status.get('status')}")

# 個別システムの詳細状態
evac_status = client.evacuation.get_status()
pdf_status = client.pdf.get_status()
wifi_status = client.wifi.get_status()
```

### 4. エラーハンドリング

```python
try:
    result = client.evacuation.search(
        query="避難所を探している",
        user_lat=35.681,
        user_lon=139.767
    )
    result.print_summary()  # 結果を整形して表示
    
except requests.exceptions.ConnectionError:
    print("サーバーに接続できません")
except requests.exceptions.HTTPError as e:
    print(f"HTTPエラー: {e}")
except Exception as e:
    print(f"エラーが発生しました: {e}")
```

## 実行例

### 簡単な例を試す

```bash
cd client
python simple_examples.py
```

### 詳細な例を試す

```bash
cd client
python usage_examples.py
```

## 利用可能なパラメータ

### EvacuationRAG.search()

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| query | str | 検索クエリ（必須） |
| user_lat | float | ユーザーの緯度 |
| user_lon | float | ユーザーの経度 |
| municipality | str | 自治体名でフィルタ |
| k_results | int | 結果件数（デフォルト: 8） |
| filter_barrier_free | bool | バリアフリー施設のみ |
| filter_hazard | str | 災害種別フィルタ |

### PDFRAG.search()

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| query | str | 検索クエリ（必須） |
| k_results | int | 結果件数（デフォルト: 6） |

### WiFiRAG.search()

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| query | str | 検索クエリ（必須） |
| user_lat | float | ユーザーの緯度 |
| user_lon | float | ユーザーの経度 |
| municipality | str | 自治体名でフィルタ |
| k_results | int | 結果件数（デフォルト: 8） |
| filter_free_only | bool | 無料WiFiのみ |
| filter_24h_only | bool | 24時間利用可能のみ |
| provider | str | 特定プロバイダーでフィルタ |

## RAGResponse オブジェクト

検索結果は `RAGResponse` オブジェクトで返されます：

```python
@dataclass
class RAGResponse:
    answer: str                    # AIが生成した回答
    sources: List[Dict[str, Any]]  # 参照元データ
    total_results: int             # 総結果件数
    system_type: str               # システム種別 ('evacuation', 'pdf', 'wifi')
    
    def print_summary(self):       # 結果を整形して表示
        # 結果を見やすく表示
```

## 設定オプション

```python
# カスタム設定でクライアントを初期化
client = UnifiedRAGClient(
    base_url="http://localhost:8000",  # APIサーバーのURL
    timeout=30,                        # リクエストタイムアウト（秒）
    max_retries=3                      # 最大リトライ回数
)

# サーバーの起動を待つ
client.wait_for_all_systems(max_wait=60)  # 最大60秒待機
```

## トラブルシューティング

### サーバーに接続できない

```python
# サーバー起動確認
if not client.wait_for_all_systems(max_wait=30):
    print("サーバーが起動していません")
    print("docker-compose up でサーバーを起動してください")
```

### システムが初期化されていない

```python
# システム状態を確認
status = client.evacuation.get_status()
if status.get('status') != 'healthy':
    print(f"避難所RAGが利用できません: {status.get('error', '不明なエラー')}")
```

### 検索結果が空

```python
result = client.evacuation.search("避難所")
if result.total_results == 0:
    print("検索結果がありません。クエリを変更してください。")
else:
    print(f"{result.total_results}件の結果が見つかりました")
```

## ファイル構成

```
client/
├── rag_client.py          # メインクライアントライブラリ
├── simple_examples.py     # 基本的な使用例
├── usage_examples.py      # 詳細な使用例
└── README.md             # このファイル
```

## サポートしている機能

- ✅ 避難所検索（位置情報ベース）
- ✅ 防災計画文書検索
- ✅ WiFiスポット検索
- ✅ フィルタリング機能
- ✅ 複合検索
- ✅ エラーハンドリング
- ✅ 自動リトライ
- ✅ システム状態チェック
- ✅ 結果の整形表示

お困りのことがあれば、`simple_examples.py` から始めてください！