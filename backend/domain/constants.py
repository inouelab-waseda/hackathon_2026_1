"""割り勘ドメインで共有する定数。"""

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
