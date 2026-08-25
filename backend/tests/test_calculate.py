"""割り勘ドメインの単体テスト。"""

import unittest

from domain import ROUNDING_UNIT, calculate_plans, validate_input


def base_input():
    return {
        "totalAmount": 48000,
        "counts": {"M2": 3, "M1": 4, "B4": 5, "B3": 2},
        "fixed": {"M2": False, "M1": False, "B4": False, "B3": False},
        "fixedAmounts": {"M2": 0, "M1": 0, "B4": 0, "B3": 0},
    }


class CalculatePlansTest(unittest.TestCase):
    def test_returns_three_plans_without_shortage(self):
        plans = calculate_plans(base_input())
        self.assertEqual(
            [plan["id"] for plan in plans],
            ["steep", "standard", "flat"],
        )
        self.assertTrue(all(plan["surplus"] == 0 for plan in plans))

    def test_non_fixed_amounts_are_500_yen_units(self):
        for plan in calculate_plans(base_input()):
            for amount in plan["perPerson"].values():
                self.assertEqual(amount % ROUNDING_UNIT, 0)

    def test_preserves_non_rounded_fixed_amount(self):
        input_data = base_input()
        input_data["fixed"]["M2"] = True
        input_data["fixedAmounts"]["M2"] = 6100
        for plan in calculate_plans(input_data):
            self.assertEqual(plan["perPerson"]["M2"], 6100)
            self.assertGreaterEqual(plan["surplus"], 0)

    def test_zero_person_grade_pays_zero(self):
        input_data = base_input()
        input_data["counts"]["M2"] = 0
        for plan in calculate_plans(input_data):
            self.assertEqual(plan["perPerson"]["M2"], 0)

    def test_chooses_smallest_reachable_surplus(self):
        input_data = {
            "totalAmount": 5000,
            "counts": {"M2": 8, "M1": 3, "B4": 0, "B3": 0},
            "fixed": {"M2": False, "M1": False, "B4": False, "B3": False},
            "fixedAmounts": {"M2": 0, "M1": 0, "B4": 0, "B3": 0},
        }
        self.assertTrue(
            all(plan["surplus"] == 500 for plan in calculate_plans(input_data))
        )

    def test_non_multiple_total_has_no_shortage(self):
        input_data = {
            "totalAmount": 48123,
            "counts": {"M2": 1, "M1": 1, "B4": 1, "B3": 1},
            "fixed": {"M2": False, "M1": False, "B4": False, "B3": False},
            "fixedAmounts": {"M2": 0, "M1": 0, "B4": 0, "B3": 0},
        }
        self.assertTrue(
            all(plan["surplus"] == 377 for plan in calculate_plans(input_data))
        )

    def test_validation_rejects_fixed_total_over_payment(self):
        input_data = base_input()
        input_data["totalAmount"] = 10000
        input_data["fixed"]["M2"] = True
        input_data["fixedAmounts"]["M2"] = 4000
        self.assertIn(
            "固定額の合計が支払額を超えています。固定額を下げてください。",
            validate_input(input_data),
        )

    def test_validation_rejects_boolean_as_money(self):
        input_data = base_input()
        input_data["totalAmount"] = True
        self.assertIn("合計金額を入力してください。", validate_input(input_data))


if __name__ == "__main__":
    unittest.main()
