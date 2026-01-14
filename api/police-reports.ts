import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import postgres from 'postgres'

// Request body schema with optional bbox coordinates for geographic filtering
const BodySchema = z.object({
  bbox: z.object({
    w: z.number(),
    s: z.number(),
    e: z.number(),
    n: z.number(),
  }).optional().nullable(),
  limit: z.number().optional().default(500),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const started = Date.now()

  try {
    // Validate request body
    const body = BodySchema.parse(req.body || {})

    // Get database connection string
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Create postgres client
    const sql = postgres(connectionString, { prepare: false })

    let rows: any[] = []

    // Query with optional bbox filter
    if (body.bbox) {
      const { w, s, e, n } = body.bbox
      console.log('DEBUG: Police reports query with bbox', { w, s, e, n, limit: body.limit })

      rows = await sql`
        SELECT 
          alert_id,
          type,
          subtype,
          latitude,
          longitude,
          street,
          city,
          alert_reliability,
          publish_datetime_utc,
          created_at
        FROM police_reports
        WHERE latitude >= ${s}
          AND latitude <= ${n}
          AND longitude >= ${w}
          AND longitude <= ${e}
        ORDER BY created_at DESC
        LIMIT ${body.limit || 500}
      `
    } else {
      console.log('DEBUG: Police reports query without bbox', { limit: body.limit })

      rows = await sql`
        SELECT 
          alert_id,
          type,
          subtype,
          latitude,
          longitude,
          street,
          city,
          alert_reliability,
          publish_datetime_utc,
          created_at
        FROM police_reports
        ORDER BY created_at DESC
        LIMIT ${body.limit || 500}
      `
    }

    console.log('DEBUG: Police reports result', { rowCount: rows.length })

    // Build GeoJSON response for map rendering
    const geoJSON = {
      type: 'FeatureCollection' as const,
      features: rows.map((row: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(row.longitude), Number(row.latitude)],
        },
        properties: {
          alert_id: row.alert_id,
          type: row.type || 'ALERT',
          subtype: row.subtype || '',
          confidence: 0, // Not available in police_reports table
          reliability: row.alert_reliability || 0,
          street: row.street || '',
          city: row.city || '',
          publishedAt: row.publish_datetime_utc || row.created_at,
          description: `${row.type}${row.subtype ? ` - ${row.subtype}` : ''}`,
          link: '',
          kind: 'police-report',
        },
      })),
    }

    const ms = Date.now() - started

    return res.status(200).json({
      status: 'ok',
      source: 'police_reports_neon',
      scan: {
        id: Math.random().toString(36).substr(2, 9),
        bboxW: body.bbox?.w || null,
        bboxS: body.bbox?.s || null,
        bboxE: body.bbox?.e || null,
        bboxN: body.bbox?.n || null,
        counts: { reports: rows.length },
      },
      geojson: geoJSON,
      meta: { ms },
    })
  } catch (error) {
    console.error('Police reports error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_REQUEST',
        details: error.errors,
      })
    }

    return res.status(500).json({
      status: 'error',
      code: 'POLICE_REPORTS_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
