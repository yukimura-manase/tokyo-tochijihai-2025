# Frontend

## 環境構築

```bash
pnpm install

# 開発用サーバーの起動
pnpm dev
```

```bash
open http://localhost:3222
```

### 環境変数

```bash
# envファイル
cp .env.example .env
```

## shadcn/ui の Component の追加について

- button Component の追加をする場合。

- [shadcn/ui の Component 一覧](https://ui.shadcn.com/docs/components)

```bash
pnpm dlx shadcn@latest add button

# または
pnpm dlx shadcn@canary add button
```
