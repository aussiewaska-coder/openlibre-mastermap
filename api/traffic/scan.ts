import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'

// Validate environment variables
const Env = z.object({
  OPENWEBNINJA_API_KEY: z.string().min(10),
  OPENWEBNINJA_BASE_URL: z.string().url(),
}).parse(process.env)

// Request body schema with bbox coordinates
const BodySchema = z.object({
  bbox: z.object({
    w: z.number(),
    s: z.number(),
    e: z.number(),
    n: z.number(),
  }),
  zoom: z.number().optional().nullable(),
  filters: z.object({
    types: z.array(z.string()).optional().nullable(),
    maxAgeMinutes: z.number().optional().nullable(),
    minConfidence: z.number().optional().nullable(),
    includeJams: z.boolean().optional().nullable(),
  }).optional().nullable(),
})

function cleanText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

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
    const body = BodySchema.parse(req.body)

    // Build OpenWebNinja URL
    const endpoint = process.env.OPENWEBNINJA_WAZE_ENDPOINT || '/waze'
    const url = new URL(endpoint, Env.OPENWEBNINJA_BASE_URL)

    // Convert bbox (w,s,e,n) to bottom_left (lat,lon) and top_right (lat,lon)
    // bbox: w=west(min lon), s=south(min lat), e=east(max lon), n=north(max lat)
    const bottomLeft = `${body.bbox.s},${body.bbox.w}`
    const topRight = `${body.bbox.n},${body.bbox.e}`

    url.searchParams.set('bottom_left', bottomLeft)
    url.searchParams.set('top_right', topRight)

    if (body.filters?.maxAgeMinutes) {
      url.searchParams.set('max_age_min', String(body.filters.maxAgeMinutes))
    }
    if (body.filters?.minConfidence != null) {
      url.searchParams.set('min_conf', String(body.filters.minConfidence))
    }
    if (body.filters?.types?.length) {
      url.searchParams.set('types', body.filters.types.join(','))
    }
    if (body.filters?.includeJams === false) {
      url.searchParams.set('include_jams', '0')
    }

    // Call OpenWebNinja Waze API with X-API-Key header
    const requestUrl = url.toString()
    const requestHeaders = { 'x-api-key': Env.OPENWEBNINJA_API_KEY }

    console.log('DEBUG: OpenWebNinja request', {
      url: requestUrl,
      keyLength: Env.OPENWEBNINJA_API_KEY.length,
      headers: requestHeaders,
    })

    const owResp = await fetch(requestUrl, {
      headers: requestHeaders,
      cache: 'no-store',
    })

    if (!owResp.ok) {
      console.error('OpenWebNinja API error:', owResp.status, await owResp.text())
      return res.status(502).json({
        status: 'error',
        code: 'OPENWEBNINJA_UPSTREAM_ERROR',
        http: owResp.status,
      })
    }

    const raw = await owResp.json()
    const alerts = Array.isArray(raw.alerts) ? raw.alerts : []
    const jams = Array.isArray(raw.jams) ? raw.jams : []

    // Build GeoJSON response for map rendering
    const geoJSON = {
      type: 'FeatureCollection',
      features: [
        ...alerts.map((a: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(a.longitude ?? a.lon), Number(a.latitude ?? a.lat)],
          },
          properties: {
            id: a.alert_id ?? a.id,
            type: String(a.type ?? 'alert').toUpperCase(),
            subtype: a.subtype ?? '',
            confidence: a.alert_confidence ?? a.confidence ?? 0,
            reliability: a.alert_reliability ?? a.reliability ?? 0,
            street: a.street ?? '',
            city: a.city ?? '',
            publishedAt: a.publish_datetime_utc ?? a.published_at ?? a.time,
            description: cleanText(a.description ?? a.text ?? ''),
            link: a.link ?? a.url ?? '',
            kind: 'alert',
          },
        })),
        ...jams.map((j: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(j.longitude ?? j.lon), Number(j.latitude ?? j.lat)],
          },
          properties: {
            id: j.jam_id ?? j.id,
            type: 'JAM',
            subtype: j.subtype ?? 'traffic',
            confidence: j.confidence ?? 0,
            reliability: j.reliability ?? 0,
            street: j.street ?? '',
            city: j.city ?? '',
            publishedAt: j.publish_datetime_utc ?? j.published_at ?? j.time,
            description: cleanText(j.description ?? j.text ?? ''),
            link: j.link ?? j.url ?? '',
            kind: 'jam',
            delay: j.delay ?? 0,
          },
        })),
      ],
    }

    const ms = Date.now() - started

    return res.status(200).json({
      status: 'ok',
      source: 'openwebninja_waze',
      scan: {
        id: Math.random().toString(36).substr(2, 9),
        bboxW: body.bbox.w,
        bboxS: body.bbox.s,
        bboxE: body.bbox.e,
        bboxN: body.bbox.n,
        counts: { alerts: alerts.length, jams: jams.length },
      },
      geojson: geoJSON,
      meta: { ms },
    })
  } catch (error) {
    console.error('Traffic scan error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_REQUEST',
        details: error.errors,
      })
    }

    return res.status(500).json({
      status: 'error',
      code: 'TRAFFIC_SCAN_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
