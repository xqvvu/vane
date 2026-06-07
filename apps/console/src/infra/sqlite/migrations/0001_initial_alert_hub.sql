CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO settings (key, value, updated_at)
VALUES ('schema_version', '0001', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  idempotency_key TEXT,
  fingerprint TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  labels_json TEXT NOT NULL,
  normalized_json TEXT NOT NULL,
  provider_metadata_json TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  raw_headers_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  config_json TEXT NOT NULL DEFAULT '{}',
  secret_refs_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  rule_json TEXT NOT NULL,
  destination_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  destination_id TEXT NOT NULL REFERENCES destinations(id),
  route_id TEXT REFERENCES routes(id),
  state TEXT NOT NULL CHECK (state IN ('pending', 'running', 'succeeded', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  next_attempt_at TEXT,
  last_error TEXT,
  rendered_payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE delivery_attempts (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  state TEXT NOT NULL CHECK (state IN ('running', 'succeeded', 'failed')),
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  UNIQUE (delivery_id, attempt_number)
);

CREATE TABLE delivery_dedupe_keys (
  source_id TEXT NOT NULL REFERENCES sources(id),
  idempotency_key TEXT NOT NULL,
  route_id TEXT NOT NULL REFERENCES routes(id),
  destination_id TEXT NOT NULL REFERENCES destinations(id),
  first_event_id TEXT NOT NULL REFERENCES events(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (source_id, idempotency_key, route_id, destination_id)
);

CREATE INDEX idx_events_source_received_at ON events (source_id, received_at);
CREATE INDEX idx_events_fingerprint_received_at ON events (fingerprint, received_at);
CREATE INDEX idx_events_severity_status ON events (severity, status);
CREATE INDEX idx_deliveries_state_next_attempt_at ON deliveries (state, next_attempt_at);
CREATE INDEX idx_deliveries_event_id ON deliveries (event_id);
CREATE INDEX idx_delivery_attempts_delivery_id ON delivery_attempts (delivery_id);
CREATE INDEX idx_delivery_dedupe_created_at ON delivery_dedupe_keys (created_at);
