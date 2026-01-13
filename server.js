import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files from dist (production) or root (development)
const staticDir = process.env.NODE_ENV === 'production' 
  ? join(__dirname, 'dist')
  : __dirname

app.use(express.static(staticDir))

// Catch-all for single-page app
app.get('*', (req, res) => {
  res.sendFile(join(staticDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`)
  console.log(`  Serving from: ${staticDir}`)
})
