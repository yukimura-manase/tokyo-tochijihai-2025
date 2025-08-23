# Server

## 環境構築 (Dev 環境)

```bash
pnpm install
pnpm dev
```

```bash
open http://localhost:3777
```

### 環境変数

```bash
# envファイル
cp .env.example .env
```

## ライブラリの追加

```bash
pnpm add ライブラリ名

# 開発用ライブラリの追加
pnpm add -D ライブラリ名
```

## データベースの起動 (Dev 環境)

```bash
docker compose up --build

# DBは、8788ポートで起動される。
```

## Prisma Migration (Dev 環境)

```bash
npx prisma migrate dev --name init
```
