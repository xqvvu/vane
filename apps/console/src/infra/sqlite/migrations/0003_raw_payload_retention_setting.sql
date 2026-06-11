INSERT INTO settings (key, value, updated_at)
VALUES ('raw_payload_retention_days', '30', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(key) DO NOTHING;
