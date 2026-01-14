import { pgTable, serial, varchar, doublePrecision, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

// Traffic Scan table - stores snapshots of each scan request
export const trafficScan = pgTable('traffic_scan', {
  id: serial('id').primaryKey(),
  bboxW: doublePrecision('bbox_w').notNull(),
  bboxS: doublePrecision('bbox_s').notNull(),
  bboxE: doublePrecision('bbox_e').notNull(),
  bboxN: doublePrecision('bbox_n').notNull(),
  zoom: integer('zoom'),
  totalAlerts: integer('total_alerts').default(0),
  totalJams: integer('total_jams').default(0),
  requestMeta: jsonb('request_meta').default('{}'),
  feedHealth: jsonb('feed_health').default('{}'),
  scannedAt: timestamp('scanned_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Traffic Event table - individual alerts/jams with deduplication
export const trafficEvent = pgTable('traffic_event', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 50 }).default('openwebninja_waze'),
  sourceEventId: varchar('source_event_id', { length: 255 }).notNull(),
  eventKind: varchar('event_kind', { length: 20 }).notNull(), // 'alert' | 'jam'
  eventType: varchar('event_type', { length: 50 }), // 'ACCIDENT' | 'HAZARD' | 'POLICE' | 'CLOSURE' | 'JAM'
  subtype: varchar('subtype', { length: 100 }),
  publishedAtUtc: timestamp('published_at_utc'),
  lat: doublePrecision('lat').notNull(),
  lon: doublePrecision('lon').notNull(),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  street: varchar('street', { length: 255 }),
  confidence: doublePrecision('confidence'),
  reliability: doublePrecision('reliability'),
  thumbsUp: integer('thumbs_up'),
  descriptionClean: text('description_clean'),
  officialLink: varchar('official_link', { length: 500 }),
  raw: jsonb('raw').notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  lastScanId: integer('last_scan_id'),
  createdAt: timestamp('created_at').defaultNow(),
})
