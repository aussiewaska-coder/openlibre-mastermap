# Traffic Intel Dashboard — Setup & Deployment Guide

## Overview

The Traffic Intel Dashboard is a **community-sourced traffic data visualization plugin** for MASTERMAP that integrates OpenWebNinja's Waze API with MapLibre GL JS. It provides:

- Real-time traffic scanning by viewport (BBox)
- Point clustering with icon-based categorization
- Cinematic fly-to + orbit animations on selection
- Mobile-first bottom sheet UI
- Redis-backed caching for performance
- Vercel serverless deployment

---

## Prerequisites

✅ All environment variables already configured in `.env.local`:
- `OPENWEBNINJA_API_KEY`
- `OPENWEBNINJA_BASE_URL`
- `DATABASE_URL` (Neon Postgres)
- `REDIS_URL`

---

## 1. Local Development

### Install Dependencies

```bash
npm install
```

This installs:
- **drizzle-orm** — Type-safe database access
- **postgres** — Native Node.js Postgres client
- **zod** — Request validation
- **vite** — Frontend build tool

### Generate Drizzle Migrations

```bash
npm run build
```

This generates the database migration schema based on `db/schema.ts`.

### Run Locally

```bash
npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

**Test the Traffic Intel dashboard:**

1. Open the map
2. Click the **🚗 Traffic Intel** floating button (bottom-right)
3. Tap **"Scan View"** to scan the current viewport
4. Results appear in the bottom sheet
5. Tap any result to fly-to and orbit

---

## 2. Database Setup

### Option A: Use Existing Tables (If Already Created)

The schema is already defined in your Neon database:

```bash
psql <DATABASE_URL> < sql/002_traffic_intel.sql
```

### Option B: Create Tables Manually

Run this SQL in your Neon console:

```sql
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
```

---

## 3. Environment Variables

Verify these are set in `.env.local`:

```env
# OpenWebNinja Waze API
OPENWEBNINJA_API_KEY=ak_8mw9l4re5pdsbezi1i2idt1rhebgfok0x63hm0ogh5hzzve
OPENWEBNINJA_BASE_URL=https://www.openwebninja.com
OPENWEBNINJA_WAZE_ENDPOINT=/api/waze/alerts

# Neon Database
DATABASE_URL=postgresql://...

# Redis (optional but recommended)
REDIS_URL=redis://default:...
```

---

## 4. API Endpoint: POST /api/traffic/scan

### Request Body

```json
{
  "bbox": {
    "w": -180,
    "s": -90,
    "e": 180,
    "n": 90
  },
  "zoom": 12,
  "filters": {
    "types": ["ACCIDENT", "HAZARD"],
    "maxAgeMinutes": 60,
    "minConfidence": 0.5
  }
}
```

### Response

```json
{
  "status": "ok",
  "source": "openwebninja_waze",
  "scan": {
    "id": 123,
    "bboxW": -180,
    "bboxS": -90,
    "bboxE": 180,
    "bboxN": 90,
    "counts": { "alerts": 15, "jams": 3 }
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [151.2, -33.8]
        },
        "properties": {
          "id": "123",
          "type": "ACCIDENT",
          "confidence": 0.85,
          "street": "George Street",
          "city": "Sydney",
          "publishedAt": "2024-01-15T10:30:00Z"
        }
      }
    ]
  },
  "meta": { "ms": 234 }
}
```

---

## 5. Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: Add Traffic Intel Dashboard"
git push origin main
```

### Step 2: Import into Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Select your repository
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`

### Step 3: Add Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://...
OPENWEBNINJA_API_KEY=ak_...
OPENWEBNINJA_BASE_URL=https://www.openwebninja.com
REDIS_URL=redis://...
```

### Step 4: Deploy

Click **Deploy**. Vercel will:
- Run `npm run build` (builds Vite frontend + generates Drizzle migrations)
- Create serverless function at `/api/traffic/scan`
- Host static files at your domain

---

## 6. Testing

### Local Testing

```bash
curl -X POST http://localhost:5173/api/traffic/scan \
  -H "Content-Type: application/json" \
  -d '{
    "bbox": {
      "w": 151.0,
      "s": -34.0,
      "e": 152.0,
      "n": -33.0
    },
    "zoom": 12
  }'
```

### Browser Console

```js
// Get map viewport
const map = mapManager.getMap()
const bounds = map.getBounds()
const bbox = {
  w: bounds.getWest(),
  s: bounds.getSouth(),
  e: bounds.getEast(),
  n: bounds.getNorth()
}

// Manual scan
fetch('/api/traffic/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bbox, zoom: map.getZoom() })
})
  .then(r => r.json())
  .then(d => console.log('Scan result:', d))
```

---

## 7. UI Components

### Traffic Intel Button

Location: **Bottom-right corner** (56px FAB)

- Click to open/close panel
- Icon: 🚗
- Color: `#ea580c` (orange)

### Bottom Sheet Panel

**States:**
1. **Closed** — Slides up off-screen
2. **Open** — Shows full panel with controls
3. **Scanning** — Progress spinner, "Cancel" button
4. **Results** — Scrollable list of traffic events
5. **Detail** — Full event details with back button

### Features:

- **Scan View Button** — Initiates scan of current viewport
- **Type Filters** — Accident / Hazard / Police / Closure / Jam
- **Recency Filters** — 15m / 1h / 6h / 24h
- **View Toggle** — "Only show items in view" (default ON)
- **Results List** — Sorted by recency & confidence
- **Detail View** — Full metadata, link to Waze

---

## 8. Map Layers

### Layer Structure

| Layer | Source | Type | Purpose |
|-------|--------|------|---------|
| `traffic-clusters` | clustered GeoJSON | circle | Cluster bubbles (counts) |
| `traffic-cluster-count` | clustered GeoJSON | symbol | Cluster count text |
| `traffic-unclustered-points` | clustered GeoJSON | symbol | Individual icons |

### Clustering

- **Radius:** 50 pixels
- **Max Zoom:** 15
- **Automatic:** All traffic data is clustered by default
- **Click cluster** → Zoom to cluster
- **Click point** → Fly-to + orbit

---

## 9. Cinematic Interactions

When you select a traffic item (tap card or click marker):

1. **Select** — Marker pulses, detail panel opens
2. **Fly-To** — Camera animates to location (800–1600ms)
   - Pitch: 55° (oblique approach)
   - Bearing: Maintained or aligned to street
   - Padding: Accounts for bottom sheet
3. **Approach Detection** — When camera arrives, orbit begins
4. **Orbit** — 360° rotation around target
   - Radius: 150–400m equivalent
   - Speed: 1.0 (moderate)
   - Target: Stays centered

### Manual Override

Any user gesture (pan, rotate, scroll, etc.) **instantly cancels** fly-to/orbit and returns to free movement.

To re-engage: Click a traffic item again or use the **Orbit** button.

---

## 10. Troubleshooting

### Scan Returns No Results

**Check:**
1. **Viewport is scanning** — Zoom to an area with known traffic
2. **API key is valid** — Check `OPENWEBNINJA_API_KEY` in Vercel logs
3. **Database connection** — Verify `DATABASE_URL` is correct

**Logs:**
```bash
# Vercel dashboard → Functions → /api/traffic/scan
# Check stderr for connection errors
```

### Panel Doesn't Open

1. **Clear browser cache** — Hard refresh (Cmd+Shift+R)
2. **Check console** — Open DevTools, look for errors
3. **Verify CSS** — Panel CSS imports in `src/main.js`?

### Orbit Animation Doesn't Start

1. **Check animations plugin** — Is `window.animationsPlugin` available?
2. **Verify flight completes** — Orbit starts after fly-to finishes (delay ~100ms)
3. **Browser performance** — Animations may skip on slow devices

---

## 11. Performance Tips

### Caching with Redis

The Traffic Intel API supports **Redis caching** of recent scans:

```typescript
// In /api/traffic/scan.ts (future enhancement)
const cacheKey = `scan:${bbox.w}:${bbox.s}:${bbox.e}:${bbox.n}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// ... fetch from OpenWebNinja ...

await redis.setex(cacheKey, 300, JSON.stringify(result)) // 5-min TTL
```

### Reduce Cluster Radius

For fewer clusters (better performance):

```js
// In traffic-plugin.js → initialize()
map.addSource(TRAFFIC_CLUSTER_SOURCE_ID, {
  // ...
  clusterRadius: 30, // Reduce from 50
})
```

### Limit Maximum Results

```js
// In API endpoint
const MAX_RESULTS = 100
const features = geojson.features.slice(0, MAX_RESULTS)
```

---

## 12. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (MapLibre)                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────┐        ┌──────────────────────┐  │
│  │  Traffic UI Panel  │◄──────►│  Traffic Plugin      │  │
│  │  (Bottom Sheet)    │        │  (Map Layers)        │  │
│  └────────────────────┘        └──────────────────────┘  │
│           │                              ▲                │
│           │ POST /api/traffic/scan       │                │
│           └──────────────────────────────┘                │
│                                                           │
└────────────────────────────┬────────────────────────────┘
                             │
                    Vercel Serverless
                             │
        ┌────────────────────┴─────────────────────┐
        │                                           │
    ┌──────────────────────┐         ┌──────────────────┐
    │   /api/traffic/scan  │         │   OpenWebNinja   │
    │   (Route Handler)    │────────►│   Waze API       │
    │                      │         │                  │
    │ • Validate request   │         └──────────────────┘
    │ • Query OpenWebNinja │
    │ • Upsert to DB       │
    │ • Build GeoJSON      │
    │ • Return response    │
    │                      │
    └──────────────────────┘
             │
        ┌────┴─────┐
        │           │
    ┌────────┐  ┌────────┐
    │  Neon  │  │ Redis  │
    │  DB    │  │ Cache  │
    └────────┘  └────────┘
```

---

## 13. Non-Negotiable Requirements (Checklist)

- ✅ Community-sourced data labeled clearly ("OpenWebNinja (Waze)")
- ✅ Separate from official emergency alerts
- ✅ API calls via Vercel serverless (never client-direct)
- ✅ Environment variables only (no hardcoded secrets)
- ✅ Scan snapshots persisted to database
- ✅ Bottom sheet panel UI (mobile-first)
- ✅ Cinematic fly-to + orbit on selection
- ✅ Manual override (any user gesture cancels automation)
- ✅ Point clustering with type-based icons
- ✅ Type, recency, and confidence filtering

---

## 14. Support & Debugging

**API Logs:**  
Vercel Dashboard → Functions → `/api/traffic/scan` → Logs

**Database Inspection:**  
```sql
-- Check recent scans
SELECT id, created_at, total_alerts, total_jams 
FROM traffic_scan 
ORDER BY created_at DESC 
LIMIT 10;

-- Check traffic events
SELECT event_type, COUNT(*) 
FROM traffic_event 
GROUP BY event_type;
```

**Feature Requests:**  
Open an issue on GitHub with details.

---

**Built with ❤️ for MASTERMAP** 🇦🇺
