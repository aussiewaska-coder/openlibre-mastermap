-- Traffic Intel Schema Addition (Neon Postgres)
-- Add traffic_scan and traffic_event tables to existing schema

CREATE TABLE IF NOT EXISTS "public"."traffic_scan" (
    "id" serial PRIMARY KEY,
    "bbox_w" double precision NOT NULL,
    "bbox_s" double precision NOT NULL,
    "bbox_e" double precision NOT NULL,
    "bbox_n" double precision NOT NULL,
    "zoom" integer,
    "total_alerts" integer DEFAULT 0,
    "total_jams" integer DEFAULT 0,
    "request_meta" jsonb DEFAULT '{}',
    "feed_health" jsonb DEFAULT '{}',
    "scanned_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."traffic_event" (
    "id" serial PRIMARY KEY,
    "source" varchar(50) DEFAULT 'openwebninja_waze',
    "source_event_id" varchar(255) NOT NULL,
    "event_kind" varchar(20) NOT NULL,
    "event_type" varchar(50),
    "subtype" varchar(100),
    "published_at_utc" timestamp,
    "lat" double precision NOT NULL,
    "lon" double precision NOT NULL,
    "country" varchar(100),
    "city" varchar(100),
    "street" varchar(255),
    "confidence" double precision,
    "reliability" double precision,
    "thumbs_up" integer,
    "description_clean" text,
    "official_link" varchar(500),
    "raw" jsonb NOT NULL,
    "last_seen_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "last_scan_id" integer REFERENCES "traffic_scan"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "traffic_event_source_event_id_key" UNIQUE("source", "source_event_id")
);

CREATE INDEX IF NOT EXISTS "idx_traffic_event_source_event_id" ON "traffic_event" ("source", "source_event_id");
CREATE INDEX IF NOT EXISTS "idx_traffic_event_published_at" ON "traffic_event" ("published_at_utc" DESC);
CREATE INDEX IF NOT EXISTS "idx_traffic_event_last_seen_at" ON "traffic_event" ("last_seen_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_traffic_event_location" ON "traffic_event" ("lat", "lon");
CREATE INDEX IF NOT EXISTS "idx_traffic_scan_created_at" ON "traffic_scan" ("created_at" DESC);
