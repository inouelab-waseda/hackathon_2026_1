# ---------- 依存インストールまでの共通部分 ----------
FROM node:22-alpine AS base
WORKDIR /app
# package.json だけを先にコピーすることで、ソース変更のたびに
# npm install が走るのを防ぐ（Docker のレイヤキャッシュを活かす）
COPY package.json package-lock.json* ./
RUN npm install

# ---------- 開発用（compose から使うのはここ） ----------
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- 本番ビルド ----------
FROM base AS build
COPY . .
RUN npm run build

# ---------- 本番配信（ビルド成果物だけを軽量イメージに載せる） ----------
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
