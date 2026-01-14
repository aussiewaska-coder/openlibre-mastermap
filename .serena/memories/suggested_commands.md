# Development Commands

## Running the Project
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Git Commands
- `git status` - Check working tree status
- `git add .` - Stage all changes
- `git commit -m "message"` - Create commit
- `git log --oneline` - View recent commits
- `git diff` - View unstaged changes
- `git diff --cached` - View staged changes

## Database (Neon)
- Access console: https://console.neon.tech/
- Query with psql: `psql $DATABASE_URL -c "SELECT ..."`
- Connection string from: Neon dashboard → Connection Details

## Map Debugging
- `window.animationsPlugin` - Access animations from console
- `window.trafficPlugin` - Access traffic plugin from console
- `mapManager.getMap()` - Get MapLibre instance
- DevTools → Network tab: check DEM tile requests, API responses
- DevTools → Performance: profile animations and layer rendering

## Build & Deploy
- Local: `npm run dev` then http://localhost:5173
- Vercel: Push to GitHub, auto-deploys on PR merge
- Environment variables: Set in Vercel dashboard (not .env.local)
