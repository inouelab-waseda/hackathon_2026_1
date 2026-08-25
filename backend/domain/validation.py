"""割り勘APIの入力検証。"""

from __future__ import annotations

from typing import Any

from .constants import GRADES, MAX_SAFE_INTEGER, MAX_SETTLEMENT_TEXT_LENGTH


def validate_input(input_data: Any) -> list[str]:
    """問題がなければ空配列、問題があれば画面表示可能な文言を返す。"""
    if not isinstance(input_data, dict):
        return ["JSONオブジェクトを送信してください。"]

    errors: list[str] = []
    total_amount = input_data.get("totalAmount")
    if not _is_safe_integer(total_amount) or total_amount <= 0:
        errors.append("合計金額を入力してください。")

    counts = input_data.get("counts")
    fixed = input_data.get("fixed")
    fixed_amounts = input_data.get("fixedAmounts")
    if not isinstance(counts, dict):
        errors.append("人数を学年ごとに入力してください。")
    if not isinstance(fixed, dict):
        errors.append("固定指定を学年ごとに入力してください。")
    if not isinstance(fixed_amounts, dict):
        errors.append("固定額を学年ごとに入力してください。")
    if errors and not all(
        isinstance(value, dict) for value in (counts, fixed, fixed_amounts)
    ):
        return errors

    invalid_count_grades = [
        grade
        for grade in GRADES
        if not _is_safe_integer(counts.get(grade)) or counts[grade] < 0
    ]
    if invalid_count_grades:
        errors.append(
            "人数は0以上の整数で入力してください（"
            + "・".join(invalid_count_grades)
            + "）。"
        )

    invalid_fixed_flag_grades = [
        grade for grade in GRADES if not isinstance(fixed.get(grade), bool)
    ]
    if invalid_fixed_flag_grades:
        errors.append(
            "固定指定は真偽値で入力してください（"
            + "・".join(invalid_fixed_flag_grades)
            + "）。"
        )

    invalid_fixed_amount_grades = [
        grade
        for grade in GRADES
        if fixed.get(grade) is True
        and (
            not _is_safe_integer(fixed_amounts.get(grade))
            or fixed_amounts[grade] < 0
        )
    ]
    if invalid_fixed_amount_grades:
        errors.append(
            "固定額は0円以上の整数で入力してください（"
            + "・".join(invalid_fixed_amount_grades)
            + "）。"
        )

    if invalid_count_grades:
        return errors

    head_count = sum(counts[grade] for grade in GRADES)
    if head_count == 0:
        errors.append("人数を1人以上入力してください。")

    has_distributable = any(
        fixed.get(grade) is False and counts[grade] > 0
        for grade in GRADES
    )
    if head_count > 0 and not invalid_fixed_flag_grades and not has_distributable:
        errors.append(
            "すべての学年を固定すると案を作れません。"
            "1つ以上の学年の固定を外してください。"
        )

    if (
        not invalid_fixed_flag_grades
        and not invalid_fixed_amount_grades
        and _is_safe_integer(total_amount)
        and total_amount > 0
    ):
        fixed_collected = sum(
            counts[grade] * fixed_amounts[grade]
            for grade in GRADES
            if fixed[grade]
        )
        if fixed_collected > total_amount:
            errors.append(
                "固定額の合計が支払額を超えています。固定額を下げてください。"
            )

    return errors


def validate_settlement_input(input_data: Any) -> list[str]:
    """決済履歴APIへ保存するデータを検証する。"""
    if not isinstance(input_data, dict):
        return ["JSONオブジェクトを送信してください。"]

    errors: list[str] = []
    total_amount = input_data.get("totalAmount")
    surplus = input_data.get("surplus")
    counts = input_data.get("counts")
    per_person = input_data.get("perPerson")

    if not _is_safe_integer(total_amount) or total_amount <= 0:
        errors.append("合計金額は1円以上の整数で指定してください。")
    if not _is_safe_integer(surplus) or surplus < 0:
        errors.append("余剰金額は0円以上の整数で指定してください。")
    if not isinstance(counts, dict):
        errors.append("人数を学年ごとのオブジェクトで指定してください。")
    if not isinstance(per_person, dict):
        errors.append("1人あたり金額を学年ごとのオブジェクトで指定してください。")

    for field, label in (("eventName", "行事名"), ("shopName", "店名")):
        value = input_data.get(field)
        if value is not None and not isinstance(value, str):
            errors.append(label + "は文字列またはnullで指定してください。")
        elif isinstance(value, str) and len(value.strip()) > MAX_SETTLEMENT_TEXT_LENGTH:
            errors.append(
                label
                + f"は{MAX_SETTLEMENT_TEXT_LENGTH}文字以内で指定してください。"
            )

    if not isinstance(counts, dict) or not isinstance(per_person, dict):
        return errors

    invalid_count_grades = [
        grade
        for grade in GRADES
        if not _is_safe_integer(counts.get(grade)) or counts[grade] < 0
    ]
    if invalid_count_grades:
        errors.append(
            "人数は0以上の整数で指定してください（"
            + "・".join(invalid_count_grades)
            + "）。"
        )

    invalid_amount_grades = [
        grade
        for grade in GRADES
        if not _is_safe_integer(per_person.get(grade))
        or per_person[grade] < 0
    ]
    if invalid_amount_grades:
        errors.append(
            "1人あたり金額は0円以上の整数で指定してください（"
            + "・".join(invalid_amount_grades)
            + "）。"
        )

    if not invalid_count_grades and sum(counts[grade] for grade in GRADES) == 0:
        errors.append("人数を1人以上指定してください。")

    if (
        not invalid_count_grades
        and not invalid_amount_grades
        and _is_safe_integer(total_amount)
        and total_amount > 0
        and _is_safe_integer(surplus)
        and surplus >= 0
    ):
        collected = sum(
            counts[grade] * per_person[grade] for grade in GRADES
        )
        if not _is_safe_integer(collected) or collected - total_amount != surplus:
            errors.append("徴収合計と余剰金額が一致しません。")

    return errors


def _is_safe_integer(value: Any) -> bool:
    return (
        isinstance(value, int)
        and not isinstance(value, bool)
        and abs(value) <= MAX_SAFE_INTEGER
    )
