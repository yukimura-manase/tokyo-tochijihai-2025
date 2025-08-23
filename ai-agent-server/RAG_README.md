# 統合災害対応RAGシステム

## 概要
このシステムは、避難所データのCSVファイルと防災計画PDFファイルを使用して、包括的な災害対応情報検索を提供します。2つの独立したRAGシステムが連携して動作します：

1. **避難所RAG**: 位置情報を考慮した避難所検索
2. **防災計画RAG**: 防災計画文書からの情報検索

## 主な機能

### 避難所RAG
- **セマンティック検索**: 自然言語でのクエリに対応
- **地理的検索**: ユーザーの現在地からの距離を考慮した結果のランキング
- **ハイブリッド検索**: セマンティック検索と地理的距離を組み合わせた高精度な検索
- **フィルタリング**: バリアフリー施設、自治体、災害種別でのフィルタリング

### 防災計画RAG
- **文書検索**: PDFから関連情報を効率的に検索
- **チャンク化**: 大きなPDF文書を適切なサイズに分割して検索精度を向上
- **ページ参照**: 回答に元のページ番号を含めて参照しやすく

## セットアップ

### 1. 環境変数の設定（docker-compose.yml）
```yaml
environment:
  # 避難所RAG設定
  - EVAC_CSV_PATH=/app/dataset/001_避難所位置情報/130001_evacuation_area.csv
  - EVAC_PERSIST_DIR=/app/chroma_evac
  
  # PDF RAG設定
  - PDF_PATH=/app/dataset/003_防災計画/2023_1.pdf
  - PDF_PERSIST_DIR=/app/chroma_pdf
  - PDF_CHUNK_SIZE=1000
  - PDF_CHUNK_OVERLAP=200
  
  # 共通設定
  - USE_OPENAI=false  # OpenAI APIを使用する場合はtrue
  # - OPENAI_API_KEY=your-api-key  # OpenAI使用時は設定
```

### 2. サービスの起動
```bash
cd ai-agent-server
docker-compose up -d
```

## API エンドポイント

### 避難所RAGシステム

#### 1. 避難所RAGシステムのステータス確認
```bash
GET /rag/status
```

#### 2. 避難所検索
```bash
POST /rag/search
Content-Type: application/json

{
    "query": "車椅子対応の避難所",
    "user_lat": 35.681,
    "user_lon": 139.767,
    "municipality": "千代田区",  # オプション
    "k_results": 8,               # オプション（デフォルト: 8）
    "filter_barrier_free": true,  # オプション
    "filter_hazard": "earthquake" # オプション
}
```

#### パラメータ説明
- `query`: 検索クエリ（必須）
- `user_lat`, `user_lon`: ユーザーの位置情報（距離順ソートに使用）
- `municipality`: 自治体名でフィルタ
- `k_results`: 返す結果の数
- `filter_barrier_free`: バリアフリー施設のみ表示
- `filter_hazard`: 特定の災害種別でフィルタ
  - 値: `flood`, `earthquake`, `tsunami`, `large_fire` など

#### 3. 避難所インデックスの再構築
```bash
POST /rag/rebuild-index
```

### 防災計画RAGシステム

#### 1. PDF RAGシステムのステータス確認
```bash
GET /pdf/status
```

#### 2. 防災計画文書検索
```bash
POST /pdf/search
Content-Type: application/json

{
    "query": "避難所の設営について",
    "k_results": 6  # オプション（デフォルト: 6）
}
```

#### パラメータ説明
- `query`: 検索クエリ（必須）
- `k_results`: 返す結果の数

#### 3. PDF インデックスの再構築
```bash
POST /pdf/rebuild-index
```

## 使用例

### 避難所検索（Python）
```python
import requests

# 東京駅付近の車椅子対応避難所を検索
response = requests.post(
    "http://localhost:8000/rag/search",
    json={
        "query": "車椅子対応の避難所を教えて",
        "user_lat": 35.681,
        "user_lon": 139.767,
        "filter_barrier_free": True,
        "k_results": 5
    }
)

data = response.json()
print(data["answer"])
for source in data["sources"]:
    print(f"- {source['facility']} ({source['distance_km']}km)")
```

### 防災計画検索（Python）
```python
import requests

# 防災計画から避難所設営について検索
response = requests.post(
    "http://localhost:8000/pdf/search",
    json={
        "query": "避難所の設営手順と必要な準備について教えて",
        "k_results": 4
    }
)

data = response.json()
print(data["answer"])
for source in data["sources"]:
    page = source.get('page', '不明')
    print(f"- {source['source']} (ページ: {page + 1 if page != '不明' else page})")
    print(f"  内容: {source['content'][:100]}...")
```

### テストスクリプトの実行
```bash
cd ai-agent-server/examples

# 避難所RAGのテスト
python test_rag_api.py

# 防災計画RAGのテスト
python test_pdf_rag_api.py
```

## データ構造

### 避難所検索レスポンス形式
```json
{
    "answer": "避難所に関する回答テキスト",
    "sources": [
        {
            "facility": "施設名",
            "address": "住所",
            "municipality": "自治体",
            "lat": 35.681,
            "lon": 139.767,
            "distance_km": 1.234,
            "phone": "電話番号",
            "is_barrier_free": true,
            "hazards": ["地震", "洪水"]
        }
    ],
    "total_results": 5
}
```

### PDF検索レスポンス形式
```json
{
    "answer": "防災計画に関する回答テキスト",
    "sources": [
        {
            "content": "関連する文書の内容...",
            "source": "2023_1.pdf",
            "page": 15,
            "chunk_index": 2,
            "document_type": "disaster_prevention_plan",
            "file_path": "/app/dataset/003_防災計画/2023_1.pdf"
        }
    ],
    "total_results": 4
}
```

## トラブルシューティング

### ベクトルDBが初期化されない場合

#### 避難所RAG
1. CSVファイルのパスが正しいか確認
2. ボリュームマウントが正しく設定されているか確認
3. ログを確認: `docker logs fastapi-ollama`

#### PDF RAG
1. PDFファイルのパスが正しいか確認
2. PDFファイルが読み取り可能か確認
3. PDFファイルが破損していないか確認
4. ログを確認: `docker logs fastapi-ollama`

### メモリ不足エラー
- `docker-compose.yml`でメモリ制限を調整
- より小さな埋め込みモデルを使用（`USE_OPENAI=false`の場合）
- PDF_CHUNK_SIZEを小さくする（デフォルト: 1000）

### 検索結果が返らない

#### 避難所RAG
1. RAGステータスを確認: `GET /rag/status`
2. CSVファイルのエンコーディングがUTF-8であることを確認
3. インデックスの再構築を試す: `POST /rag/rebuild-index`

#### PDF RAG
1. PDFステータスを確認: `GET /pdf/status`
2. PDFファイルが正常に読み込まれているか確認
3. インデックスの再構築を試す: `POST /pdf/rebuild-index`

### PDFチャンクサイズの調整
- 小さなチャンク（500-1000文字）：詳細な検索に適している
- 大きなチャンク（1000-2000文字）：文脈を保持しやすい
- オーバーラップ（100-300文字）：チャンク間の情報損失を防ぐ