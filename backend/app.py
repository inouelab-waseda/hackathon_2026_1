"""研究室割り勘アプリ バックエンド。"""

from flask import Flask, jsonify, request

from domain import calculate_plans, validate_input

app = Flask(__name__)


@app.get("/api/health")
def health():
    """疎通確認用。フロントから Vite の proxy 経由で叩かれる。"""
    return jsonify(status="ok", service="warikan-backend")


@app.post("/api/calculate")
def calculate():
    """WarikanInputを受け取り、傾斜の異なるPlanを3案返す。"""
    input_data = request.get_json(silent=True)
    errors = validate_input(input_data)
    if errors:
        return jsonify(error="validation_failed", errors=errors), 400

    try:
        return jsonify(calculate_plans(input_data))
    except (ValueError, RuntimeError) as error:
        app.logger.exception("割り勘計算に失敗しました")
        return jsonify(error="calculation_failed", errors=[str(error)]), 422


if __name__ == "__main__":
    # 通常は compose の `flask run` で起動するため、ここは直接実行したとき用
    app.run(host="0.0.0.0", port=5000, debug=True)
