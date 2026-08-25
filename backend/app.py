"""研究室割り勘アプリ バックエンド。"""

from __future__ import annotations

import os
import sqlite3
from typing import Any

from flask import Flask, jsonify, request

from db import create_settlement, init_app as init_database, init_db
from db import list_settlements
from domain import calculate_plans, validate_input, validate_settlement_input


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    """設定を差し替え可能なFlaskアプリを生成する。"""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        DATABASE=os.environ.get(
            "DATABASE_PATH",
            os.path.join(app.instance_path, "warikan.sqlite3"),
        )
    )
    if test_config is not None:
        app.config.update(test_config)

    init_database(app)
    with app.app_context():
        init_db()

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
            return jsonify(
                error="calculation_failed", errors=[str(error)]
            ), 422

    @app.post("/api/settlements")
    def save_settlement():
        """確定した割り勘を1件保存する。"""
        input_data = request.get_json(silent=True)
        errors = validate_settlement_input(input_data)
        if errors:
            return jsonify(error="validation_failed", errors=errors), 400

        try:
            return jsonify(create_settlement(input_data)), 201
        except sqlite3.Error:
            app.logger.exception("決済履歴の保存に失敗しました")
            return jsonify(
                error="database_failed",
                errors=["決済履歴を保存できませんでした。"],
            ), 500

    @app.get("/api/settlements")
    def get_settlements():
        """保存済みの割り勘を新しい順に返す。"""
        try:
            return jsonify(list_settlements())
        except sqlite3.Error:
            app.logger.exception("決済履歴の取得に失敗しました")
            return jsonify(
                error="database_failed",
                errors=["決済履歴を取得できませんでした。"],
            ), 500

    return app


app = create_app()


if __name__ == "__main__":
    # 通常は compose の `flask run` で起動するため、ここは直接実行したとき用
    app.run(host="0.0.0.0", port=5000, debug=True)
