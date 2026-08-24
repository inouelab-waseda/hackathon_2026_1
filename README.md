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
compose.yml            … frontend / backend のサービス定義
frontend/
  src/
    types/warikan.ts   … ドメインの型（= バックエンドとの API 契約）
    domain/            … 計算ロジック（純粋関数・React に依存しない）
      calculate.ts     … 3案を生成する ※現在はスタブ
      weights.ts       … 3案の傾斜係数（暫定値）
      settlement.ts    … 余剰金額の計算
      validation.ts    … 入力チェック
    state/             … 画面の状態と遷移（useReducer に集約）
    storage/           … 履歴の保存 ※現在は localStorage
    components/        … UI 部品
    screens/           … 割り勘画面・履歴画面
backend/               … Flask
  app.py               … 現在は /api/health のみ
docs/                  … 設計ドキュメント
```

## 何をしたいときに、どのファイルを触るか

| やりたいこと | 触るファイル |
|---|---|
| **傾斜の係数を変える**（M1 を厚くする等） | `frontend/src/domain/weights.ts` の表の数値だけ |
| **計算方法を差し替える**（飴玉モデルにする） | `frontend/src/domain/calculate.ts` の `calculatePlans` の中身だけ |
| **履歴の保存先を API にする** | `frontend/src/storage/historyStore.ts` の `load` / `save` の中身だけ |
| **API のリクエスト／レスポンスの形を決める** | `frontend/src/types/warikan.ts`（この型がそのまま契約） |
| 画面の見た目を変える | `frontend/src/components/` |
| 色・フォントを変える | `frontend/src/index.css` の `@theme` |
| 画面の遷移やボタンの挙動を変える | `frontend/src/state/warikanReducer.ts` |

**上の3つは、他のファイルを一切触らずに差し替えられるように作ってあります。** 型（入出力）が変わらない限り、画面側のコードには影響しません。

## 現在の実装状況（2026-08-25 時点）

動くもの：入力 → 計算 → 3案から選択 → 100円単位で調整 → 保存 → 履歴で確認、まで通しで操作できます。

暫定・未確定のもの：

| 箇所 | 状態 |
|---|---|
| `domain/calculate.ts` | **スタブ**。比率配分＋500円切り上げの簡易版。飴玉モデル（別紙 v2）への差し替えが必要 |
| `domain/weights.ts` | 傾斜係数は**チーム未合意の暫定値** |
| `storage/historyStore.ts` | localStorage 保存。バックエンドができたら差し替え |
| `state/warikanReducer.ts` の `initialState` | デモ用のサンプル値（合計48,000円 / 14人）が入っています。不要なら0に変えてください |
| 状態1の店舗名入力 | **未実装**。プロトタイプ設計に合わせ、店名は結果シートのみに置いています |

## スマホ対応について

**スマートフォンからの利用を前提に作っています。** UI を変更するときは以下を崩さないでください。

| 対応 | 内容 |
|---|---|
| 画面幅 | 375px（iPhone SE）〜430px で確認済み。横スクロールは3案のカードのみ |
| 高さ | `h-dvh` を使用。モバイルブラウザのアドレスバー伸縮でレイアウトが崩れない |
| タップ領域 | ±ボタンは **44×44px**。これより小さくすると指で押しにくく、隣を誤タップする |
| 文字サイズ | **入力欄は16px以上**にすること。16px未満だと iOS Safari がフォーカス時に勝手に画面を拡大する |
| セーフエリア | ノッチ・ホームインジケータを避けるため `.pt-safe` / `.pb-safe` を使う（`index.css` で定義） |
| タップ挙動 | 灰色のハイライトを消し、`touch-action: manipulation` でダブルタップ判定の待ち時間をなくしてある |
| キーボード | 金額・人数の入力は `inputMode="numeric"` で数字キーボードが出る |

なお、実機（iOS Safari / Android Chrome）での確認はまだです。同じ Wi-Fi なら `docker compose up` した PC の IP に `:5173` を付けてスマホから開けます。

## テスト

計算ロジックと状態遷移には単体テストがあります。**計算を差し替えたら必ず実行してください**（差し替え前後で挙動が変わっていないかの確認になります）。

```bash
docker compose run --rm frontend npm run test
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
