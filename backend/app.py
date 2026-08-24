"""研究室割り勘アプリ バックエンド.

現時点では疎通確認用のエンドポイントのみ。
フェーズ2（端数貯金）で、計算 API と SQLite へのアクセスをここに足していく。
"""

from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/api/health")
def health():
    """疎通確認用。フロントから Vite の proxy 経由で叩かれる。"""
    return jsonify(status="ok", service="warikan-backend")


if __name__ == "__main__":
    # 通常は compose の `flask run` で起動するため、ここは直接実行したとき用
    app.run(host="0.0.0.0", port=5000, debug=True)
