FROM node:22-bookworm-slim

WORKDIR /app/server

ENV NODE_ENV=development

RUN npm install -g pnpm

# 依存関係をコピーしてインストール
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install

# ソースコードをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# サーバーのポートを公開
EXPOSE 3777

# サーバーを起動
CMD ["pnpm", "dev"] 