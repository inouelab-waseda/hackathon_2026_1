"""SQLite接続と決済履歴の永続化。"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from flask import Flask, current_app, g

from domain.constants import GRADES


def get_db() -> sqlite3.Connection:
    """リクエスト中で共有するSQLite接続を返す。"""
    if "db" not in g:
        database_path = current_app.config["DATABASE"]
        parent_directory = os.path.dirname(database_path)
        if parent_directory:
            os.makedirs(parent_directory, exist_ok=True)

        connection = sqlite3.connect(database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.db = connection
    return g.db


def close_db(_error: BaseException | None = None) -> None:
    """現在のアプリコンテキストに紐づく接続を閉じる。"""
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db() -> None:
    """schema.sqlを適用し、必要なテーブルを作成する。"""
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, encoding="utf-8") as schema_file:
        get_db().executescript(schema_file.read())


def init_app(app: Flask) -> None:
    """FlaskアプリへDBの終了処理を登録する。"""
    app.teardown_appcontext(close_db)


def create_settlement(input_data: dict[str, Any]) -> dict[str, Any]:
    """決済と4学年の内訳を同一トランザクションで保存する。"""
    settlement_id = str(uuid4())
    saved_at = (
        datetime.now(timezone.utc).isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )
    event_name = _normalize_optional_text(input_data.get("eventName"))
    shop_name = _normalize_optional_text(input_data.get("shopName"))
    connection = get_db()

    with connection:
        connection.execute(
            """
            INSERT INTO settlements (
                id, saved_at, event_name, shop_name, total_amount, surplus
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                settlement_id,
                saved_at,
                event_name,
                shop_name,
                input_data["totalAmount"],
                input_data["surplus"],
            ),
        )
        connection.executemany(
            """
            INSERT INTO settlement_grades (
                settlement_id, grade, head_count, amount_per_person
            ) VALUES (?, ?, ?, ?)
            """,
            [
                (
                    settlement_id,
                    grade,
                    input_data["counts"][grade],
                    input_data["perPerson"][grade],
                )
                for grade in GRADES
            ],
        )

    return {
        "id": settlement_id,
        "savedAt": saved_at,
        "eventName": event_name,
        "shopName": shop_name,
        "totalAmount": input_data["totalAmount"],
        "counts": {grade: input_data["counts"][grade] for grade in GRADES},
        "perPerson": {
            grade: input_data["perPerson"][grade] for grade in GRADES
        },
        "surplus": input_data["surplus"],
    }


def list_settlements() -> list[dict[str, Any]]:
    """保存済みの決済を新しい順に返す。"""
    connection = get_db()
    settlement_rows = connection.execute(
        """
        SELECT id, saved_at, event_name, shop_name, total_amount, surplus
        FROM settlements
        ORDER BY saved_at DESC, rowid DESC
        """
    ).fetchall()

    records: list[dict[str, Any]] = []
    for settlement in settlement_rows:
        grade_rows = connection.execute(
            """
            SELECT grade, head_count, amount_per_person
            FROM settlement_grades
            WHERE settlement_id = ?
            """,
            (settlement["id"],),
        ).fetchall()
        grades = {row["grade"]: row for row in grade_rows}
        records.append(
            {
                "id": settlement["id"],
                "savedAt": settlement["saved_at"],
                "eventName": settlement["event_name"],
                "shopName": settlement["shop_name"],
                "totalAmount": settlement["total_amount"],
                "counts": {
                    grade: grades[grade]["head_count"] for grade in GRADES
                },
                "perPerson": {
                    grade: grades[grade]["amount_per_person"]
                    for grade in GRADES
                },
                "surplus": settlement["surplus"],
            }
        )
    return records


def _normalize_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None
