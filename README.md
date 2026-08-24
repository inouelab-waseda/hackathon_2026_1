# hackathon_2026_1

研究室で使える、学年（B3〜M2）ごとに負担額へ傾斜をつけた**割り勘アプリ**。

全体方針は [`docs/outline.md`](docs/outline.md) を参照してください。

## 技術スタック

| レイヤ | 採用 |
|---|---|
| フロントエンド | TypeScript + React + Vite |
| スタイル | Tailwind CSS |
| バックエンド | Python + Flask |
| データベース | SQLite（フェーズ2で導入） |
| 実行環境 | Docker / docker compose |

## 必要なもの

**Docker と git だけ**です。ホストに Node.js や Python を入れる必要はありません。

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（起動しておくこと）
- git

## 起動方法

```bash
git clone https://github.com/inouelab-waseda/hackathon_2026_1.git
cd hackathon_2026_1

# 初回のみ（イメージのビルド。数分かかります）
docker compose build

# 起動
docker compose up
```

起動したら ブラウザで **http://localhost:5173** を開いてください。
「フロントエンド 起動中 / バックエンド 接続OK」と表示されれば環境構築は完了です。

| URL | 内容 |
|---|---|
| http://localhost:5173 | フロントエンド（Vite の開発サーバ） |
| http://localhost:5001/api/health | バックエンド（Flask）に直接アクセスする場合 |

> バックエンドのホスト側ポートが 5001 なのは、macOS では 5000 番を AirPlay Receiver が使っているためです。

## よく使うコマンド

```bash
# 停止（Ctrl+C でも止まります）
docker compose down

# バックグラウンドで起動
docker compose up -d

# ログを見る
docker compose logs -f frontend
docker compose logs -f backend

# パッケージを追加する（例: フロントに zod を入れる）
docker compose run --rm frontend npm install zod
# → package.json と package-lock.json が更新されるので、それをコミットする

# Python のパッケージを追加する場合
# backend/requirements.txt に1行足してから
docker compose build backend

# 何かおかしくなったとき（コンテナと node_modules を作り直す）
docker compose down -v
docker compose build --no-cache
docker compose up
```

## ディレクトリ構成

```
compose.yml          … frontend / backend のサービス定義
frontend/            … React + Vite（TypeScript）
  src/
    App.tsx          … 現在は疎通確認画面
backend/             … Flask
  app.py             … 現在は /api/health のみ
docs/                … 設計ドキュメント
```

## 開発のルール

- フロントから API を叩くときは `http://localhost:5001/...` ではなく **`/api/...`** を使ってください。Vite の proxy がバックエンドに転送するため、CORS の設定が不要になります。
- ソースを編集すると自動で画面に反映されます（フロントは HMR、バックは Flask の自動リロード）。**編集のたびに再起動する必要はありません。**
- `docker compose build` が必要になるのは、`package.json` / `requirements.txt` / `Dockerfile` を変更したときだけです。

## 困ったときは

| 症状 | 対処 |
|---|---|
| ファイルを編集しても画面が変わらない | `docker compose restart frontend`。それでも駄目なら `docker compose down -v` してから再度 `up` |
| 「バックエンド 接続失敗」と出る | `docker compose logs backend` でエラーを確認 |
| ポートが使用中と言われる | 5173 / 5001 を使っている他のアプリを終了する |
| npm のパッケージが見つからないと言われる | `docker compose down -v` → `docker compose build` → `docker compose up` |
