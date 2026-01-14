# Local Development Setup — Traffic Intel Dashboard

## Quick Start (No Vercel Required)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Both Servers in Parallel

**Option A: Single Command (Recommended)**

```bash
npm run dev:full
```

This starts both:
- **Vite dev server** — `http://localhost:5173` (frontend)
- **Express API server** — `http://localhost:3001` (backend)

**Option B: Separate Terminals**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (API Server):
```bash
npm run dev:api
```

### 3. Test Traffic Intel

1. Open **`http://localhost:5173`** in your browser
2. Click **🚗 Traffic Intel** button (bottom-right)
3. Tap **"Scan View"** to scan the current map viewport
4. Results appear in the bottom sheet
5. Click any result to fly-to and orbit

---

## Environment Variables

All required variables are already in `.env.local`:

```env
OPENWEBNINJA_API_KEY=ak_8mw9l4re5pdsbezi1i2idt1rhebgfok0x63hm0ogh5hzzve
OPENWEBNINJA_BASE_URL=https://www.openwebninja.com
OPENWEBNINJA_WAZE_ENDPOINT=/api/waze/alerts
DATABASE_URL=postgresql://neondb_owner:...
REDIS_URL=redis://...
```

The `api-server.js` automatically loads these via `dotenv`.

---

## API Server Details

**File:** `api-server.js`

**What it does:**
- ✅ Starts Express server on `http://localhost:3001`
- ✅ Handles `POST /api/traffic/scan` requests
- ✅ Connects to Neon Postgres database
- ✅ Calls OpenWebNinja Waze API using env vars
- ✅ Stores scans + events in database (with deduplication)
- ✅ Returns GeoJSON for map rendering
- ✅ Supports CORS (all origins)
- ✅ Logs all operations to console

**Health Check:**
```bash
curl http://localhost:3001/health
# Response: {"status":"ok","endpoint":"/api/traffic/scan"}
```

**Manual Test:**
```bash
curl -X POST http://localhost:3001/api/traffic/scan \
  -H "Content-Type: application/json" \
  -d '{
    "bbox": {"w": 151, "s": -34, "e": 152, "n": -33},
    "zoom": 12
  }'
```

---

## How It Works

### Development Flow

```
Browser (localhost:5173)
        ↓
    Vite Dev Server
        ↓
Traffic Intel UI (traffic-panel.js)
        ↓
  fetch() → http://localhost:3001/api/traffic/scan
        ↓
API Server (api-server.js)
        ↓
Database + OpenWebNinja
        ↓
Response (GeoJSON)
        ↓
Traffic Plugin (traffic.js)
        ↓
Map Layer Clusters & Points
```

### Production Flow (Vercel)

```
Browser (your-domain.vercel.app)
        ↓
Vite Static Frontend
        ↓
Traffic Intel UI
        ↓
fetch() → /api/traffic/scan
        ↓
Vercel Serverless Function (/api/traffic/scan.ts)
        ↓
Database + OpenWebNinja
        ↓
Response (GeoJSON)
```

---

## Switching to Vercel Deployment

When ready to deploy:

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Add environment variables** in Vercel dashboard
4. **Done!** Vercel auto-detects Vite + deploys `/api` routes as serverless functions

No code changes needed—the same codebase works locally and on Vercel.

---

## Troubleshooting

### Port Already in Use

If port 3001 is taken:

```bash
API_PORT=3002 npm run dev:api
```

Then update the URL in `traffic-panel.js` (scanView function).

### Database Connection Error

```
❌ DATABASE_URL not set in .env.local
```

**Fix:** Verify `.env.local` has valid Neon connection string:
```bash
cat .env.local | grep DATABASE_URL
```

### API Returns 404

Make sure you're running:
- `npm run dev:full` (both servers), OR
- `npm run dev` + `npm run dev:api` in separate terminals

### Traffic Intel Button Doesn't Appear

1. Hard refresh browser (Cmd+Shift+R)
2. Check console for errors
3. Verify CSS was imported in `src/main.js`

### Scan Returns Empty Results

1. **Verify OpenWebNinja API key** is correct
2. **Check internet connection** (OpenWebNinja is called remotely)
3. **Zoom to an area with traffic** (may be no alerts in current viewport)
4. **Check API logs**:
   ```bash
   # Look at npm run dev:api terminal output
   # Should show: "✓ OpenWebNinja returned: X alerts, Y jams"
   ```

---

## Scripts Reference

```bash
npm run dev           # Vite dev server only (localhost:5173)
npm run dev:api       # Express API server only (localhost:3001)
npm run dev:full      # Both servers in parallel (recommended)
npm run build         # Build for production + generate Drizzle migrations
npm run preview       # Preview production build locally
npm run db:migrate    # Run Drizzle migrations against Neon
```

---

## File Structure

```
api-server.js              # Local development API server
src/plugins/features/traffic.js    # Map plugin (layers, clustering)
src/plugins/ui/traffic-panel.js    # Bottom sheet UI
api/traffic/scan.ts        # Vercel serverless endpoint (for production)
db/schema.ts               # Drizzle ORM schema
db/client.ts               # Database connection setup
```

---

## Next Steps

1. ✅ Run `npm install`
2. ✅ Run `npm run dev:full`
3. ✅ Open `http://localhost:5173`
4. ✅ Click 🚗 button → "Scan View"
5. ✅ Results should load (check console if not)
6. ✅ Deploy to Vercel when ready

---

**Happy hacking!** 🚗🗺️
