# 🇦🇺 OpenLibre MasterMap — Australia Terrain & Alerts Platform

> **A plugin‑centric, mobile‑first geospatial platform for Australia**  
> Built on **MapLibre GL JS**, deployed on **Vercel**, with **Neon (Postgres)** and optional **Redis** powering real‑time alerting.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-blue)
![Deployment](https://img.shields.io/badge/deploy-vercel-black)
![Architecture](https://img.shields.io/badge/architecture-plugin--centric-purple)

---

## ✨ What This Is

OpenLibre MasterMap is **not a demo map**.

It is a **map runtime + data platform** where:
- there is **one MapLibre map instance**,
- **all capabilities are plugins**,
- **UI is optional**,
- and **data‑driven features (alerts, events, telemetry)** are first‑class citizens.

This repository currently ships:
- a **full Australia 3D terrain system**, and
- the **foundations for a real‑time alerts dashboard plugin** backed by Neon and Redis.

If you want a map that:
- scales beyond visualization,
- supports live data and alerts,
- runs cleanly on mobile,
- and doesn’t collapse under feature growth,

this is that system.

---

## 🧠 Core Capabilities (via Plugins)

### ✅ Shipping Plugins

#### 🏔️ Terrain Plugin
- DEM‑based 3D terrain with configurable exaggeration
- AWS Marketplace elevation tiles (Terrarium format)
- Hillshade toggle for enhanced relief
- Zoom levels 0–15

#### 🌄 Imagery Plugin
- Satellite imagery toggle (Esri World Imagery)
- Seamless layer switching

#### 🎛️ Controls Plugin
- MapLibre official UI controls: zoom, navigation, globe, geolocation, fullscreen, scale
- Touch-friendly button sizing (44px+)
- Tooltip support

#### 🎬 Animations System *(New - Deployed)*
- **Cinematic fly-to** with adaptive camera pitch
- **Orbital motion** — 360° bearing rotation around point
- **Box zoom** — Shift+drag to define bounds
- Gesture interruption (user interaction stops animation immediately)
- Smooth easing curves
- Performance optimized for mobile

#### 🚗 **Traffic Intel Dashboard Plugin** *(Now Shipping - Recently Completed)*
- **Real-time Waze alert ingestion** via OpenWebNinja API
- **Spatial clustering** with point symbols
  - Clustered circles with count badges
  - Type-based icons (🚗 🚔 ⚠️ 🚫 🚦)
  - Unclustered individual points
- **Mobile-first bottom sheet UI**
  - Floating toggle button (56px FAB, bottom-right)
  - Smooth slide-up animation
  - Filter controls (type, recency, confidence)
  - Results list with pagination
  - Detail view on item selection
- **Filtering**
  - By alert type (Accident, Hazard, Police, Closure, Jam, etc.)
  - By recency (15m, 1h, 6h, 24h)
  - By confidence level
  - Jam inclusion toggle
- **Interactions**
  - Click alert → cinematic fly-to + 6°/sec orbit animation
  - Manual orbit stop via user gesture
  - Pan/rotate map while orbiting (animation interrupts cleanly)
- **Data Display**
  - Street, city, description
  - Published timestamp
  - Confidence & reliability scores
  - Community-sourced data disclaimer
- **API Integration**
  - Endpoint: `/api/scan` (Vercel serverless function)
  - Proxies OpenWebNinja Waze alerts-and-jams API
  - Returns GeoJSON for map rendering
  - All alert types supported (ACCIDENT, HAZARD, POLICE, CAMERA, JAM, ROAD_CLOSED_LANE, FREEWAY_CLOSED, MODERATE_TRAFFIC, HEAVY_TRAFFIC, LIGHT_TRAFFIC)

All plugins operate on the **same map instance**.

---

## 🧱 Technology Stack

| Layer | Technology |
|---|---|
| Map Engine | **MapLibre GL JS** |
| Build Tool | **Vite** |
| Deployment | **Vercel (only)** |
| Database | **Neon (Serverless Postgres)** |
| Cache / Realtime | **Redis** (optional) |
| Terrain Data | **AWS Marketplace elevation‑tiles‑prod** (Terrarium) |
| Basemap | **OpenStreetMap** |
| UI (Path A) | Vanilla DOM + CSS |
| UI (Path B) | React + Tailwind + shadcn/ui |
| Icons | **Lucide (SVG)** + animated variants |

---

## 📦 Prerequisites

- **Node.js** 18+ (or 20+)
- **npm**
- **Git**
- **Vercel account**
- **Neon account** (free tier is sufficient)

Optional:
- Redis provider (Upstash / Redis Cloud / self‑managed)

---

## 🚀 Quick Start (Local Dev)

### 1. Clone

```bash
git clone https://github.com/yourusername/openlibre-mastermap.git
cd openlibre-mastermap
```

### 2. Install

```bash
npm install
```

### 3. Run Dev Server

```bash
npm run dev
```

- Vite dev server starts at `http://localhost:5173`
- Hot module reload enabled
- Map opens automatically

You should see **Australia centered**, with terrain enabled.

---

## 🗺️ 3D Terrain Verification

1. Enable **3D Mode** (camera pitch)
2. Rotate (right‑click / two‑finger drag)
3. Increase **Terrain Exaggeration** (2.0+)
4. Toggle **Hillshade**

If DEM tiles are loading correctly, relief will be obvious.

---

## 🗺️ DEM Terrain Tiles (AWS Marketplace)

### Source
- Product: `elevation-tiles-prod`
- Format: **Terrarium PNG**
- Zoom levels: 0–15
- Source data: Mapzen JOERD

### Public Tile URL

```
https://elevation-tiles-prod.s3.amazonaws.com/{z}/{x}/{y}.png
```

No credentials required for default access.

### Terrarium Encoding

```
elevation_meters = (R × 256 + G + B / 256) − 32768
```

⚠️ This is **not** Mapbox terrain‑rgb.

---

## 🧠 Data Layer (Neon + Redis)

### Neon (Primary Database)

Neon is used for **all persistent data**, including:
- alerts
- alert metadata
- user preferences
- plugin configuration
- historical timelines

**Why Neon**
- Serverless Postgres
- Native Vercel integration
- Branching for environments
- Excellent fit for geospatial + time‑series data

### Redis (Optional, Recommended)

Redis is used for:
- real‑time alert fan‑out
- hot alert caches
- rate limiting
- websocket / SSE acceleration

Redis is **not required** for basic operation but becomes important at scale.

---

## 🚀 Deployment — Vercel (Canonical)

> **This project is designed to run on Vercel only.**

Vercel provides:
- environment variables
- server functions
- edge/runtime flexibility
- secure secret handling
- global CDN

Static‑only hosting is **explicitly unsupported**.

---

### Vercel Setup

1. Push repo to GitHub
2. Import into **Vercel**
3. Framework preset: **Vite**
4. Build command:
   ```
   npm run build
   ```
5. Output directory:
   ```
   dist
   ```

---

## 🔐 Environment Variables (Vercel Runtime)

All configuration is provided via **Vercel Environment Variables**.

### Required

```
OPENWEBNINJA_API_KEY=ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENWEBNINJA_BASE_URL=https://api.openwebninja.com
```

(Needed for Traffic Intel Dashboard to fetch Waze alerts)

### Optional (Future)

```
DATABASE_URL=postgresql://...              # Neon connection (when alerts DB is ready)
REDIS_URL=redis://...                      # Redis cache (optional acceleration)
DEM_TILE_URL=https://.../{z}/{x}/{y}.png   # Custom DEM tiles (default: AWS)
```

### Rules
- Secrets **never** go into client bundles
- Server Functions access via `process.env`
- Client variables must be explicitly exposed (avoid unless necessary)
- All API keys must be set in Vercel dashboard (NOT in .env.local)

---

## 🧩 Server Functions (Vercel Serverless)

### Current Endpoints

#### `POST /api/scan` — Traffic Intel Scanning *(Live)*
**Purpose**: Proxy OpenWebNinja Waze API, return GeoJSON for map rendering

**Request**:
```json
{
  "bbox": {
    "w": -116.5,      // west (min longitude)
    "s": -33.9,       // south (min latitude)
    "e": -116.0,      // east (max longitude)
    "n": -33.8        // north (max latitude)
  },
  "zoom": 12,         // optional
  "filters": {        // optional
    "types": ["ACCIDENT", "HAZARD"],
    "maxAgeMinutes": 60,
    "minConfidence": 2,
    "includeJams": true
  }
}
```

**Response**:
```json
{
  "status": "ok",
  "source": "openwebninja_waze",
  "scan": {
    "id": "abc123",
    "bboxW": -116.5,
    "bboxS": -33.9,
    "bboxE": -116.0,
    "bboxN": -33.8,
    "counts": { "alerts": 12, "jams": 5 }
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [lon, lat] },
        "properties": {
          "id": "alert_id",
          "type": "ACCIDENT",
          "subtype": "ACCIDENT_MAJOR",
          "confidence": 3,
          "reliability": 4,
          "street": "Highway 1",
          "city": "Sydney",
          "publishedAt": "2026-01-14T22:46:58Z",
          "description": "Multi-car accident",
          "link": "https://...",
          "kind": "alert"
        }
      }
    ]
  },
  "meta": { "ms": 3200 }
}
```

**Implementation**: `api/scan.ts` (Vercel serverless function)
- Validates request bbox + filters
- Proxies to `https://api.openwebninja.com/waze/alerts-and-jams`
- Auth: `x-api-key` header with OpenWebNinja API key
- Transforms response into GeoJSON for MapLibre layers
- Returns all alert types (ACCIDENT, HAZARD, POLICE, CAMERA, JAM, etc.)

### Future Endpoints

Server Functions are designed for:
- Tile proxying / signing (DEM, satellite)
- Alerts database operations (CRUD)
- Aggregations & heatmaps
- Auth & user preferences
- Real-time subscriptions (Neon + Redis)

Example structure:
```
/api/
  scan.ts                    # Traffic Intel (live)
  tiles/
    [z]/[x]/[y].ts          # DEM tile proxy
  alerts/
    ingest.ts               # Store to Neon
    query.ts                # Retrieve from Neon
  auth/
    login.ts
    logout.ts
```

---

## 🧩 Plugin‑Centric Project Structure

```
src/
├── main.js                           # Plugin orchestration & initialization
├── core/
│   ├── mapManager.js                 # MapLibre instance + layer management
│   └── stateManager.js               # Global app state
├── config/
│   ├── defaults.js                   # Default plugin config
│   └── tiles.js                      # DEM & imagery tile sources
├── plugins/
│   ├── features/
│   │   ├── terrain.js                # 3D terrain with DEM
│   │   ├── imagery.js                # Satellite imagery toggle
│   │   ├── controls.js               # MapLibre UI controls
│   │   ├── animations.js             # Cinematic fly-to & orbit
│   │   └── traffic.js                # Traffic Intel map layer
│   └── ui/
│       ├── traffic-panel.js          # Traffic Intel UI (bottom sheet)
│       └── traffic-panel.css         # Mobile-first styling
└── style.css                         # Global styles
```

### Key Files for Traffic Intel

| File | Purpose |
|------|---------|
| `api/scan.ts` | Vercel serverless function (OpenWebNinja proxy) |
| `src/plugins/features/traffic.js` | Map clustering, layers, selection handling |
| `src/plugins/ui/traffic-panel.js` | Bottom sheet UI, filters, results list |
| `src/plugins/ui/traffic-panel.css` | Mobile-optimized styling |
| `src/main.js` | Initialize traffic plugin & UI |

### Plugin Initialization Flow

1. **main.js** loads all plugins
2. **traffic.js** adds GeoJSON source + cluster layers to map
3. **traffic-panel.js** creates floating button + bottom sheet UI
4. User clicks button → panel opens
5. User clicks "Scan View" → calls `/api/scan` with current bbox
6. API returns GeoJSON → traffic.js updates map source
7. User clicks point → animations.js runs fly-to + orbit

📖 **Plugin Development:**
See `PLUGIN_ARCHITECTURE.md` for standard lifecycle and extension patterns.

---

## 🗺️ MapLibre API Paradigm

> **Rule: Use MapLibre's official API first. Only build custom code when the API doesn't provide it.**

MASTERMAP uses **only** the official MapLibre GL JS API. No custom interaction handlers, no reinvented wheels.

### Built-in Handlers (Automatic)

These work out-of-the-box with zero configuration:

| Handler | Trigger | Function |
|---------|---------|----------|
| **BoxZoomHandler** | Shift + drag | Draw box, zoom to bounds |
| **DragPanHandler** | Click + drag | Pan the map |
| **DragRotateHandler** | Right-click + drag | Rotate 3D view |
| **ScrollZoomHandler** | Mouse wheel | Zoom in/out |
| **DoubleClickZoomHandler** | Double-click | Zoom in one level |
| **KeyboardHandler** | Arrow keys, +/-, etc | Navigation shortcuts |
| **TwoFingersTouchZoomHandler** | Pinch (mobile) | Touch zoom |
| **TwoFingersTouchRotateHandler** | 2-finger rotate (mobile) | Touch rotate |

### Official Controls (Added via Plugin)

Location: `src/plugins/features/controls.js`

| Control | Function | Position |
|---------|----------|----------|
| **NavigationControl** | Zoom buttons + compass | top-left |
| **GlobeControl** | Toggle globe ↔ mercator | top-right |
| **GeolocateControl** | Show user location | top-right |
| **FullscreenControl** | Fullscreen toggle | top-right |
| **ScaleControl** | Distance scale bar | bottom-right |
| **AttributionControl** | Map credits | bottom-right |
| **LogoControl** | MapLibre logo | bottom-left |

### Documentation

- **Full API Reference:** https://maplibre.org/maplibre-gl-js/docs/API/
- **Handler Classes:** BoxZoomHandler, DragPanHandler, DragRotateHandler, etc.
- **Control Classes:** NavigationControl, GeolocateControl, FullscreenControl, etc.

### Adding New Map Features

**Before writing custom code**, check the MapLibre API docs:
- Need custom tooltips? Check `Popup` class
- Need drawing tools? Use data sources + layers (MapLibre styling)
- Need real-time updates? Use `setData()` on GeoJSON sources
- Need custom styling? Use MapLibre layer paint/layout properties

**If MapLibre provides it, use it.** Only build custom code in plugins when extending beyond the official API.

---

## 🖥️ Current State (Live & Deployed)

### Map & Terrain ✅
- **Australia terrain** in globe projection with 3D relief
- **Satellite imagery** toggle (Esri World Imagery)
- **DEM tiles** from AWS Marketplace (Terrarium format, zoom 0–15)

### Controls & Navigation ✅
- **MapLibre official controls**: zoom buttons, compass, projection toggle (globe ↔ mercator), geolocation, fullscreen, scale bar
- **Touch gestures**: All built-in handlers enabled
  - Single-finger drag = pan
  - Two-finger pinch = zoom
  - Two-finger rotate = bearing rotation
  - Shift+drag = box zoom

### Animations System ✅ *(Deployed & Live)*
- **Cinematic fly-to** with smooth easing
- **Orbital camera** rotation (6°/sec) around selected points
- **Gesture interruption** — animations stop immediately on user interaction
- Used by Traffic Intel for alert selection experience

### Traffic Intel Dashboard ✅ *(Deployed & Live - Now Shipping)*
- **Floating toggle button** 🚗 (bottom-right, 56px FAB)
- **Bottom sheet panel** with:
  - Status bar (last scan time, in-view count, total count)
  - "Scan View" button to fetch traffic for current viewport
  - Type filters (Accident, Hazard, Police, Closure, Jam)
  - Recency filters (15m, 1h, 6h, 24h)
  - Results list showing alerts & jams
  - Detail view with full data (street, city, timestamp, confidence)
- **Map visualization**
  - Clustered points with count badges
  - Type-based emoji icons
  - Click alert → cinematic fly-to + orbit animation
  - Clean animation interruption on user gesture
- **Data source**: OpenWebNinja Waze API (real-time alerts & jams)
- **Mobile-optimized**: Bottom sheet, 44px+ touch targets, thumb-zone placement

### API Endpoints
- **`/api/scan`** (POST) — Traffic Intel scanning
  - Request: bbox coordinates, filters
  - Response: GeoJSON with clustered alerts/jams
  - Auth: OpenWebNinja API key (environment variable)

---

## 📱 Mobile‑First Doctrine (Mandatory)

- Touch targets ≥ **44px**
- Bottom sheets instead of side panels
- Thumb‑zone placement
- No hover‑only UI
- Map gestures always win
- Responsive typography via `clamp()`

---

## 🎨 Icons & Motion

- Icon set: **Lucide**
- SVG‑based
- Animated icons where available
- CSS / SVG motion only (no heavy libs)

---

## 🏗️ Build

```bash
npm run build
```

Handled automatically by Vercel.

---

## 🧪 Troubleshooting

### Map & Terrain
**Flat map?**
- Check camera pitch (drag up/right to tilt)
- Verify terrain layer: `map.getTerrain()`
- Check DEM tiles loading in Network tab
- Verify `OPENWEBNINJA_API_KEY` is set (even though not needed for terrain)

### Traffic Intel Dashboard
**Traffic button not appearing?**
- Check browser console for initialization errors
- Verify plugin loaded: `window.trafficPlugin` in console
- Check CSS is loading (check Network tab for `.css` files)

**Scan returns 0 results?**
- Verify viewport bbox is valid (use browser zoom)
- Check Vercel logs for `DEBUG: OpenWebNinja request` output
- Verify `OPENWEBNINJA_API_KEY` is set in Vercel (not just `.env.local`)
- Check response data structure: `DEBUG: Response keys:` should include `['status', 'request_id', 'parameters', 'data']`
- Verify OpenWebNinja API key has access to Waze `/waze/alerts-and-jams` endpoint
- Check if region genuinely has no Waze reports at that moment

**API returns 403 Forbidden?**
- Verify `OPENWEBNINJA_API_KEY` in Vercel environment variables
- Check Vercel logs: `OpenWebNinja API error: 403`
- Ensure API key hasn't expired in OpenWebNinja account
- Verify account has Waze endpoint access (may require subscription upgrade)
- Check header is lowercase `x-api-key` (case-sensitive)

**Animation lag?**
- Reduce viewport size or enable reduced motion on mobile
- Check for heavy map layers causing render bottleneck
- Profile in Chrome DevTools (Performance tab)

### General Performance
**Slow page load?**
- Check Network tab for slow DEM tile requests
- Verify Vercel functions are deployed (check dashboard)
- Profile bundle size: `npm run build && wc -c dist/**/*`

**Mobile issues?**
- Test in Chrome DevTools Device Mode
- Check touch target sizes (should be 44px+)
- Verify no hover-only UI elements
- Test bottom sheet panel on small screens

---

## 📜 License

MIT License.

---

## 🧭 References

### Core Technologies
- **MapLibre GL JS** — https://maplibre.org/ (map rendering engine)
- **Vercel** — https://vercel.com/ (serverless deployment)
- **Neon** — https://neon.tech/ (serverless Postgres, future)

### Data Sources
- **AWS Marketplace Elevation Tiles** — Terrarium format DEM tiles (zoom 0–15)
  - URL: `https://elevation-tiles-prod.s3.amazonaws.com/{z}/{x}/{y}.png`
- **Mapzen JOERD** — https://github.com/tilezen/joerd (elevation source data)
- **OpenStreetMap** — Basemap tiles
- **Esri World Imagery** — Satellite basemap layer
- **OpenWebNinja Waze API** — Real-time traffic alerts & jams
  - Endpoint: `https://api.openwebninja.com/waze/alerts-and-jams`
  - API Key required: https://www.openwebninja.com/

### Development
- **Vite** — Build tool (dev server, production bundling)
- **Zod** — TypeScript request validation
- **Node.js** 18+ — Runtime
- **npm** — Package manager

---

## 📝 What's Shipped

✅ **3D Terrain System** — Full Australia DEM with hillshade
✅ **Satellite Imagery** — Esri World Imagery toggle
✅ **Controls** — MapLibre native UI (navigation, zoom, geolocation, fullscreen, scale)
✅ **Animations System** — Cinematic fly-to + orbital camera motion
✅ **Traffic Intel Dashboard** — Real-time Waze alerts with clustering, filtering, & cinematic detail view

**Built as a platform, not a prototype.** 🇦🇺

---

## 🚀 Next Phase

- Store alerts in Neon (persistent timeline)
- Redis-backed real-time subscriptions
- Alert history & playback
- Custom alert rules & notifications
- Multi-region expansion (Australia → beyond)
- User preferences & account system
