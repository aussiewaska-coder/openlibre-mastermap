-- Traffic Intel Dashboard Schema (Neon Postgres)
-- Stores scan snapshots and individual traffic events from OpenWebNinja Waze API

-- Create traffic_scan table (snapshots of each scan request)
CREATE TABLE IF NOT EXISTS traffic_scan (
  id BIGSERIAL PRIMARY KEY,
  bbox_w FLOAT NOT NULL,
  bbox_s FLOAT NOT NULL,
  bbox_e FLOAT NOT NULL,
  bbox_n FLOAT NOT NULL,
  zoom INT,
  total_alerts INT DEFAULT 0,
  total_jams INT DEFAULT 0,
  request_meta JSONB DEFAULT '{}',
  feed_health JSONB DEFAULT '{}',
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create traffic_event table (individual alerts/jams with deduplication)
CREATE TABLE IF NOT EXISTS traffic_event (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) DEFAULT 'openwebninja_waze',
  source_event_id VARCHAR(255) NOT NULL,
  event_kind VARCHAR(20) NOT NULL, -- 'alert' or 'jam'
  event_type VARCHAR(50), -- 'ACCIDENT', 'HAZARD', 'POLICE', 'CLOSURE', 'JAM'
  subtype VARCHAR(100),
  published_at_utc TIMESTAMPTZ,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  country VARCHAR(100),
  city VARCHAR(100),
  street VARCHAR(255),
  confidence FLOAT,
  reliability FLOAT,
  thumbs_up INT,
  description_clean TEXT,
  official_link VARCHAR(500),
  raw JSONB NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  last_scan_id BIGINT REFERENCES traffic_scan(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Composite unique constraint for deduplication
  UNIQUE(source, source_event_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_traffic_event_source_event_id ON traffic_event(source, source_event_id);
CREATE INDEX IF NOT EXISTS idx_traffic_event_location ON traffic_event USING GIST (
  ll_to_earth(lat, lon)
);
CREATE INDEX IF NOT EXISTS idx_traffic_event_published_at ON traffic_event(published_at_utc DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_event_last_seen_at ON traffic_event(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_scan_created_at ON traffic_scan(created_at DESC);

-- Enable PostGIS extension if needed for spatial queries
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
