FROM node:22-bookworm-slim

RUN npm install -g pnpm

WORKDIR /app/frontend

# 依存関係をコピーしてインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# アプリケーションコードをコピー
COPY . .

# フロントエンドのポートを設定
EXPOSE 3222

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
