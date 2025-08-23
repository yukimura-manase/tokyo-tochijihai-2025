# AI Agent Server

## 概要

- FastAPI で作成された AI Agent Server
- Python 系の AI Agent などは、こちらの Server で管理する。

## 注意事項

1. DB の読み取りは、OK
2. DB の更新処理は、System Server (Hono) Server に寄せる。
3. 処理フローは、System 担当者と要相談 📝
   - FE -> System Server(DB 読み取り/更新) -> AI Agent Server みたいな処理フローも検討

## 環境構築

### 前提条件

以下のソフトウェアが必要です:
- **Docker**: バージョン 20.10 以上
- **Docker Compose**: バージョン 2.0 以上
- **Git**: バージョン管理用

### システム要件

- **OS**: Linux, macOS, Windows (Docker Desktop)
- **メモリ**: 8GB以上推奨 (AI モデル実行のため)
- **ディスク容量**: 5GB以上の空き容量
- **Python**: 3.10以上 (開発・テスト用)

### 環境構築手順

#### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/tokyo-tochijihai-2025.git
cd tokyo-tochijihai-2025/ai-agent-server
```

#### 2. データセットの配置

プロジェクトルートに `dataset` ディレクトリを配置:
```
tokyo-tochijihai-2025/
├── dataset/
│   ├── 001_避難所位置情報/
│   │   └── 130001_evacuation_area.csv
│   └── 003_防災計画/
│       └── 2023_1.pdf
└── ai-agent-server/
```

#### 3. Dockerコンテナの起動

```bash
# 自動起動スクリプトを実行
chmod +x start.sh
./start.sh
```

または手動で起動:
```bash
# Docker Compose でサービス起動
docker compose up -d

# ログの確認
docker compose logs -f
```

#### 4. サービスの確認

サービスが正常に起動したことを確認:
```bash
# ヘルスチェック
curl http://localhost:8000/health

# API ドキュメントをブラウザで確認
# http://localhost:8000/docs
```

### 開発環境のセットアップ

#### Python依存関係のインストール

```bash
# uvを使用（推奨）
pip install uv
uv sync

# または pip を使用
pip install -r app/requirements.txt
pip install -r requirements-test.txt
```

#### テストの実行

```bash
# 全テストの実行
python -m pytest

# カバレッジ付きテスト
python -m pytest --cov=app tests/

# 特定のテストファイル実行
python -m pytest tests/test_health.py
```

### 環境変数

主要な環境変数（`docker-compose.yml`で設定済み）:

```bash
# Ollama設定
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=phi4-mini

# データパス
EVAC_CSV_PATH=/app/dataset/001_避難所位置情報/130001_evacuation_area.csv
EVAC_PERSIST_DIR=/app/chroma_evac
PDF_PATH=/app/dataset/003_防災計画/2023_1.pdf
PDF_PERSIST_DIR=/app/chroma_pdf

# OpenAI設定（オプション）
USE_OPENAI=false
# OPENAI_API_KEY=your-api-key-here

# PDF処理設定
PDF_CHUNK_SIZE=1000
PDF_CHUNK_OVERLAP=200
```

### トラブルシューティング

#### よくある問題

1. **ポートが使用中のエラー**
   ```bash
   # 使用中のポートを確認
   netstat -tulpn | grep :8000
   # または別のポートを使用
   docker compose -f docker-compose.yml -p custom up -d
   ```

2. **メモリ不足エラー**
   - Docker Desktop のメモリ制限を 8GB 以上に設定
   - 不要なコンテナを停止: `docker system prune`

3. **モデルダウンロードの失敗**
   ```bash
   # 手動でモデルをダウンロード
   docker exec -it ollama-server ollama pull phi4-mini
   ```

#### ログの確認

```bash
# 全サービスのログ
docker compose logs -f

# 特定のサービスのログ
docker compose logs -f fastapi
docker compose logs -f ollama
```

#### コンテナの再起動

```bash
# サービスの停止
docker compose down

# ボリュームも含めて完全削除
docker compose down -v

# 再ビルド
docker compose build --no-cache
docker compose up -d
```

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
- phi4-mini モデルのダウンロード（ビルド時に事前実行）
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
