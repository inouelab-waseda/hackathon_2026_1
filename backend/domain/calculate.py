"""学年ごとの傾斜付き割り勘を計算する純粋関数。"""

from __future__ import annotations

from math import ceil, isfinite
from typing import Any, TypedDict

GRADES = ("M2", "M1", "B4", "B3")
ROUNDING_UNIT = 500
MAX_SAFE_INTEGER = 2**53 - 1

WEIGHT_PRESETS = (
    {
        "id": "steep",
        "name": "案A",
        "weights": {"M2": 2.08, "M1": 1.68, "B4": 1.21, "B3": 1.0},
    },
    {
        "id": "standard",
        "name": "案B",
        "weights": {"M2": 1.6, "M1": 1.4, "B4": 1.1, "B3": 1.0},
    },
    {
        "id": "flat",
        "name": "案C",
        "weights": {"M2": 1.12, "M1": 1.12, "B4": 0.99, "B3": 1.0},
    },
)


class Candidate(TypedDict):
    units: dict[str, int]
    fairness: float


def calculate_plans(input_data: dict[str, Any]) -> list[dict[str, Any]]:
    """TypeScript版と同じ契約で、傾斜の異なる3案を返す。"""
    _assert_calculable_input(input_data)

    plans: list[dict[str, Any]] = []
    for preset in WEIGHT_PRESETS:
        per_person = _allocate(input_data, preset["weights"])
        plans.append(
            {
                "id": preset["id"],
                "name": preset["name"],
                "perPerson": per_person,
                "surplus": _calc_surplus(input_data, per_person),
            }
        )
    return plans


def _allocate(
    input_data: dict[str, Any],
    weights: dict[str, float],
) -> dict[str, int]:
    """余剰最小、次に傾斜からの誤差最小となる500円ブロック配分を求める。"""
    per_person = _by_grade(0)
    open_grades: list[str] = []
    remaining = input_data["totalAmount"]

    for grade in GRADES:
        if input_data["fixed"][grade]:
            per_person[grade] = input_data["fixedAmounts"][grade]
            remaining -= input_data["counts"][grade] * per_person[grade]
        elif input_data["counts"][grade] > 0:
            open_grades.append(grade)

    if remaining <= 0:
        return per_person
    if not open_grades:
        raise ValueError("支払額の残りを負担できる、非固定の参加者がいません。")

    denominator = sum(
        input_data["counts"][grade] * weights[grade]
        for grade in open_grades
    )
    if not isfinite(denominator) or denominator <= 0:
        raise ValueError("傾斜係数は正の有限値で指定してください。")

    ideal_units = _by_grade(0.0)
    for grade in open_grades:
        ideal_amount = remaining * weights[grade] / denominator
        ideal_units[grade] = ideal_amount / ROUNDING_UNIT

    required_blocks = ceil(remaining / ROUNDING_UNIT)
    smallest_grade_size = min(input_data["counts"][grade] for grade in open_grades)
    max_blocks = required_blocks + smallest_grade_size - 1
    candidate = _find_best_candidate(
        input_data["counts"],
        open_grades,
        ideal_units,
        required_blocks,
        max_blocks,
    )

    for grade in open_grades:
        per_person[grade] = candidate["units"][grade] * ROUNDING_UNIT
    return per_person


def _find_best_candidate(
    counts: dict[str, int],
    open_grades: list[str],
    ideal_units: dict[str, float],
    required_blocks: int,
    max_blocks: int,
) -> Candidate:
    """到達できる徴収ブロック数ごとに、最も公平な候補だけを残す。"""
    states: dict[int, Candidate] = {
        0: {"units": _by_grade(0), "fairness": 0.0}
    }

    for grade in open_grades:
        next_states: dict[int, Candidate] = {}
        count = counts[grade]

        for collected_blocks, candidate in states.items():
            max_units_for_grade = (max_blocks - collected_blocks) // count
            for units in range(max_units_for_grade + 1):
                next_blocks = collected_blocks + count * units
                deviation = units - ideal_units[grade]
                next_units = candidate["units"].copy()
                next_units[grade] = units
                next_candidate: Candidate = {
                    "units": next_units,
                    "fairness": candidate["fairness"]
                    + count * deviation * deviation,
                }
                current = next_states.get(next_blocks)
                if current is None or _is_fairer(next_candidate, current):
                    next_states[next_blocks] = next_candidate

        states = next_states

    for blocks in range(required_blocks, max_blocks + 1):
        candidate = states.get(blocks)
        if candidate is not None:
            return candidate

    raise RuntimeError("割り勘案を生成できませんでした。")


def _is_fairer(candidate: Candidate, current: Candidate) -> bool:
    """同点時は上級生側の負担が大きい候補を選び、結果を決定的にする。"""
    epsilon = 1e-9
    if candidate["fairness"] < current["fairness"] - epsilon:
        return True
    if candidate["fairness"] > current["fairness"] + epsilon:
        return False

    for grade in GRADES:
        if candidate["units"][grade] != current["units"][grade]:
            return candidate["units"][grade] > current["units"][grade]
    return False


def _calc_surplus(
    input_data: dict[str, Any],
    per_person: dict[str, int],
) -> int:
    collected = sum(
        input_data["counts"][grade] * per_person[grade]
        for grade in GRADES
    )
    return collected - input_data["totalAmount"]


def _assert_calculable_input(input_data: dict[str, Any]) -> None:
    total_amount = input_data.get("totalAmount")
    if not _is_safe_integer(total_amount) or total_amount <= 0:
        raise ValueError("合計金額は1円以上の整数で指定してください。")

    for field in ("counts", "fixed", "fixedAmounts"):
        if not isinstance(input_data.get(field), dict):
            raise ValueError(field + "は学年ごとのオブジェクトで指定してください。")

    for grade in GRADES:
        count = input_data["counts"].get(grade)
        if not _is_safe_integer(count) or count < 0:
            raise ValueError(grade + "の人数は0以上の整数で指定してください。")

        fixed = input_data["fixed"].get(grade)
        if not isinstance(fixed, bool):
            raise ValueError(grade + "の固定指定は真偽値で指定してください。")

        fixed_amount = input_data["fixedAmounts"].get(grade)
        if fixed and (
            not _is_safe_integer(fixed_amount) or fixed_amount < 0
        ):
            raise ValueError(grade + "の固定額は0円以上の整数で指定してください。")


def _is_safe_integer(value: Any) -> bool:
    return (
        isinstance(value, int)
        and not isinstance(value, bool)
        and abs(value) <= MAX_SAFE_INTEGER
    )


def _by_grade(value: int | float) -> dict[str, Any]:
    return {grade: value for grade in GRADES}
