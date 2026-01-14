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

### Shipping Plugins
- 🏔️ **Terrain Plugin** — DEM‑based 3D terrain with configurable exaggeration
- 🌄 **Imagery Plugin** — Satellite imagery toggle (Esri World Imagery)
- 🎛️ **Controls Plugin** — MapLibre official UI controls (zoom, navigation, globe, geolocation, fullscreen, scale)

### Planned / Primary Feature Plugin
- 🚨 **Alerts Dashboard Plugin** *(core future focus)*
  - Real‑time alert ingestion
  - Spatial filtering & clustering
  - Timeline playback
  - Severity‑based styling
  - Mobile‑safe alert panels
  - Backed by **Neon Postgres**
  - Accelerated with **Redis** (optional)

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
DATABASE_URL=postgresql://...
```

(Provided automatically when Neon is connected via the Vercel dashboard.)

### Optional

```
DEM_TILE_URL=https://elevation-tiles-prod.s3.amazonaws.com/{z}/{x}/{y}.png
REDIS_URL=redis://...
```

### Rules
- Secrets **never** go into client bundles
- Server Functions access via `process.env`
- Client variables must be explicitly exposed (avoid unless necessary)

---

## 🧩 Server Functions

Server Functions are used for:
- DEM tile proxying / signing
- Alerts ingestion
- Alerts queries
- Aggregations
- Auth (future)

Example structure:

```
/api/
  alerts/
    ingest.ts
    query.ts
  tiles/
    [z]/[x]/[y].ts
```

Example (simplified):

```ts
export default async function handler(req, res) {
  const alerts = await db.query('SELECT * FROM alerts ORDER BY created_at DESC')
  res.json(alerts)
}
```

---

## 🧩 Plugin‑Centric Project Structure

```
src/
├── main.js                     # Plugin orchestration
├── core/
│   ├── mapManager.js
│   └── stateManager.js
├── config/
│   └── defaults.js
│   └── tiles.js
├── plugins/
│   └── features/               # terrain, imagery, controls, alerts (future)
└── style.css
```

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

## 🖥️ Current State

- **Map**: Australia terrain in globe projection with satellite imagery
- **Controls**: MapLibre official controls (navigation, projection toggle, geolocation, fullscreen, scale)
- **Interactions**: All MapLibre built-in handlers enabled (Shift+drag zoom, drag pan, rotate, scroll zoom, keyboard nav, touch gestures)
- **Data**: Ready for alerts plugin integration with Neon + Redis

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

## 🧪 Troubleshooting (Quick)

**Flat map?**
- Check camera pitch
- Check `map.getTerrain()`
- Verify DEM tiles load

**No alerts showing?**
- Verify `DATABASE_URL`
- Check server function logs in Vercel
- Confirm table exists in Neon

**Performance issues?**
- Reduce DEM `maxzoom`
- Introduce Redis caching
- Test mobile early

---

## 📜 License

MIT License.

---

## 🧭 References

- MapLibre GL JS — https://maplibre.org/
- Neon — https://neon.tech/
- Vercel — https://vercel.com/
- Mapzen JOERD — https://github.com/tilezen/joerd

---

**Built as a platform, not a prototype.** 🇦🇺
