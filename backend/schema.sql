CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    saved_at TEXT NOT NULL,
    event_name TEXT,
    shop_name TEXT,
    total_amount INTEGER NOT NULL CHECK (total_amount > 0),
    -- 負なら徴収額が不足しており、担当者が差額を立て替えたことを意味する
    surplus INTEGER NOT NULL,
    has_payer_contribution INTEGER NOT NULL CHECK (has_payer_contribution IN (0, 1)),
    payer_contribution_amount INTEGER NOT NULL CHECK (payer_contribution_amount >= 0)
);

CREATE TABLE IF NOT EXISTS settlement_grades (
    settlement_id TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('M2', 'M1', 'B4', 'B3')),
    head_count INTEGER NOT NULL CHECK (head_count >= 0),
    amount_per_person INTEGER NOT NULL CHECK (amount_per_person >= 0),
    PRIMARY KEY (settlement_id, grade),
    FOREIGN KEY (settlement_id) REFERENCES settlements (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settlements_saved_at
    ON settlements (saved_at DESC);
