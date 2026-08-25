"""Flask計算APIの結合テスト。"""

import unittest

from app import app
from tests.test_calculate import base_input


class CalculateApiTest(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

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


if __name__ == "__main__":
    unittest.main()
