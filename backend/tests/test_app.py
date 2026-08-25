"""Flask APIの結合テスト。"""

import os
import sqlite3
import tempfile
import unittest

from app import create_app
from tests.test_calculate import base_input


def settlement_input():
    return {
        "eventName": "歓迎会",
        "shopName": "研究室食堂",
        "totalAmount": 48000,
        "counts": {"M2": 3, "M1": 4, "B4": 5, "B3": 2},
        "perPerson": {"M2": 5000, "M1": 4000, "B4": 2500, "B3": 2500},
        "surplus": 500,
    }


class CalculateApiTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = os.path.join(
            self.temporary_directory.name, "test.sqlite3"
        )
        self.app = create_app(
            {"TESTING": True, "DATABASE": self.database_path}
        )
        self.client = self.app.test_client()

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

    def test_calculate(self):
        response = self.client.post("/api/calculate", json=base_input())
        self.assertEqual(response.status_code, 200)
        plans = response.get_json()
        self.assertEqual(len(plans), 3)
        self.assertTrue(all(plan["surplus"] >= 0 for plan in plans))

    def test_invalid_input(self):
        input_data = base_input()
        input_data["totalAmount"] = 0
        response = self.client.post("/api/calculate", json=input_data)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "validation_failed")

    def test_non_json_request(self):
        response = self.client.post(
            "/api/calculate",
            data="not-json",
            content_type="text/plain",
        )
        self.assertEqual(response.status_code, 400)

    def test_save_and_list_settlement(self):
        input_data = settlement_input()
        input_data["eventName"] = "  歓迎会  "

        save_response = self.client.post(
            "/api/settlements", json=input_data
        )
        self.assertEqual(save_response.status_code, 201)
        saved = save_response.get_json()
        self.assertTrue(saved["id"])
        self.assertTrue(saved["savedAt"].endswith("Z"))
        self.assertEqual(saved["eventName"], "歓迎会")
        self.assertEqual(saved["counts"], input_data["counts"])
        self.assertEqual(saved["perPerson"], input_data["perPerson"])

        list_response = self.client.get("/api/settlements")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.get_json(), [saved])

        connection = sqlite3.connect(self.database_path)
        try:
            settlement_count = connection.execute(
                "SELECT COUNT(*) FROM settlements"
            ).fetchone()[0]
            grade_count = connection.execute(
                "SELECT COUNT(*) FROM settlement_grades"
            ).fetchone()[0]
        finally:
            connection.close()
        self.assertEqual(settlement_count, 1)
        self.assertEqual(grade_count, 4)

    def test_lists_newest_settlement_first(self):
        first = settlement_input()
        first["eventName"] = "1件目"
        second = settlement_input()
        second["eventName"] = "2件目"

        self.client.post("/api/settlements", json=first)
        self.client.post("/api/settlements", json=second)

        records = self.client.get("/api/settlements").get_json()
        self.assertEqual(
            [record["eventName"] for record in records],
            ["2件目", "1件目"],
        )

    def test_rejects_inconsistent_surplus(self):
        input_data = settlement_input()
        input_data["surplus"] = 0

        response = self.client.post("/api/settlements", json=input_data)

        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "徴収合計と余剰金額が一致しません。",
            response.get_json()["errors"],
        )
        self.assertEqual(self.client.get("/api/settlements").get_json(), [])

    def test_rejects_non_json_settlement(self):
        response = self.client.post(
            "/api/settlements",
            data="not-json",
            content_type="text/plain",
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
