# AI Agent Server

## 概要

- FastAPI で作成された AI Agent Server

- Python 系の AI Agent などは、こちらの Server で管理する。

## 注意事項

1. DB の読み取りは、OK

2. DB の更新処理は、System Server (Hono) Server に寄せる。

3. 処理フローは、System 担当者と要相談 📝

   - FE -> System Server(DB 読み取り/更新) -> AI Agent Server みたいな処理フローも検討

## Ollama + FastAPI + LangChain Integration

### phi4-mini モデルの利用

このプロジェクトでは、Ollama を使用して phi4-mini モデルを FastAPI 経由で提供しています。

### アーキテクチャ

- **Ollama Server**: Docker コンテナで動作し、phi4-mini モデルをホスト
- **FastAPI Application**: LangChain を使用してモデルと対話する REST API を提供
- **Docker Compose**: 両サービスを適切なネットワーキングで調整

### クイックスタート

1. サービスの起動:
```bash
./start.sh
```

このスクリプトは以下を実行します:
- Ollama サーバーの起動
- phi4-mini モデルのダウンロード
- FastAPI アプリケーションの起動

2. API へのアクセス:
- API エンドポイント: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/health

### API エンドポイント

1. **ヘルスチェック**
   - `GET /health` - サービスの稼働状況と Ollama の接続確認

2. **基本的なチャット**
   - `POST /chat` - プロンプトを送信してレスポンスを取得
   ```json
   {
     "prompt": "こんにちは、AIとは何ですか？",
     "temperature": 0.7,
     "max_tokens": 100
   }
   ```

3. **チャット補完 (OpenAI互換)**
   - `POST /chat/completions` - OpenAI スタイルのチャット補完
   ```json
   {
     "messages": [
       {"role": "user", "content": "機械学習とは何ですか？"}
     ],
     "temperature": 0.7,
     "max_tokens": 150
   }
   ```

4. **ストリーミングチャット**
   - `POST /chat/stream` - ストリーミングレスポンスを取得
   ```json
   {
     "prompt": "物語を聞かせてください",
     "temperature": 0.8,
     "max_tokens": 200,
     "stream": true
   }
   ```

### テスト

すべてのエンドポイントをテストするサンプルスクリプトの実行:

```bash
pip install requests aiohttp
python examples/test_api.py
```

### Docker コマンド

```bash
# サービスの起動
docker-compose up -d

# ログの確認
docker-compose logs -f

# サービスの停止
docker-compose down

# サービスの再ビルド
docker-compose build
```

### 要件

- Docker と Docker Compose
- NVIDIA CPU or GPU (オプション、推論の高速化用)
- Python 3.11+ (テストスクリプト実行用)
