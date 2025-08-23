# AI Project Template Ver. Docker

## ディレクトリ構造

```bash
tree -L 1
.
├── README.md
├── docker-compose.yml
├── docs # 開発者向けDocs
├── frontend # React Vite App
├── ai-agent-server # FastAPI Server: AI Agent Server
└── server # Hono Server: System Server
```

## すべての環境をまとめて起動する。

```bash
docker compose up --build
```

### データベースだけの起動 (Dev 環境)

```bash
docker compose up db --build

# DBは、8788
```

## local 開発での各環境について 📝

基本的に詳細は、各環境の README.md を確認 or 記載するようにしてください。

### FrontEnd

- App Route: http://localhost:3222/

### Hono Server (System 全体を管理する Server)

- App Route: http://localhost:3777
