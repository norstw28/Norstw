-- แบบแผนอ้างอิง SQLite สำหรับ 3 ตัวตรง/โต๊ด (ยังไม่ได้ใช้ในแอป: แอปใช้ IndexedDB)
-- ทดสอบสร้างตารางและข้อจำกัดใน SQLite หน่วยความจำแล้ว
PRAGMA foreign_keys = ON;
PRAGMA user_version = 2;

CREATE TABLE slips (
  slip_id      TEXT PRIMARY KEY,
  slip_date    TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  sent_money   TEXT NOT NULL DEFAULT '',
  note         TEXT NOT NULL DEFAULT '',
  header_key   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX ux_slips_header_active ON slips(header_key) WHERE status = 'active';

CREATE TABLE entries3 (
  entry_id      TEXT PRIMARY KEY,
  slip_id       TEXT NOT NULL REFERENCES slips(slip_id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('straight','tod')),
  number        TEXT NOT NULL CHECK (length(number) = 3 AND number NOT GLOB '*[^0-9]*'),
  amount_satang INTEGER NOT NULL CHECK (amount_satang > 0),
  raw_text      TEXT NOT NULL DEFAULT '',
  saved_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (type <> 'tod' OR
         (substr(number,1,1) <= substr(number,2,1) AND substr(number,2,1) <= substr(number,3,1))),
  UNIQUE (slip_id, type, number)
);

CREATE INDEX ix_entries3_slip ON entries3(slip_id);

CREATE VIEW v_slip_totals3 AS
SELECT s.slip_id, s.slip_date, s.name,
       COALESCE(SUM(CASE WHEN e.type='straight' THEN e.amount_satang END),0)/100.0 AS total_straight,
       COALESCE(SUM(CASE WHEN e.type='tod'      THEN e.amount_satang END),0)/100.0 AS total_tod,
       COUNT(e.entry_id) AS rows_count
FROM slips s LEFT JOIN entries3 e ON e.slip_id = s.slip_id
WHERE s.status = 'active'
GROUP BY s.slip_id;

-- บวกยอดเมื่อเลขซ้ำ
-- INSERT INTO entries3(entry_id, slip_id, type, number, amount_satang, raw_text)
-- VALUES (?, ?, ?, ?, ?, ?)
-- ON CONFLICT(slip_id, type, number)
-- DO UPDATE SET amount_satang = amount_satang + excluded.amount_satang;
