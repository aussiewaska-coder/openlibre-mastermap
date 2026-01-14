import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../db/client'
import { trafficScan, trafficEvent } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

// Validate environment variables
const Env = z.object({
  OPENWEBNINJA_API_KEY: z.string().min(10),
  OPENWEBNINJA_BASE_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
}).parse(process.env)

// Request body schema
const BodySchema = z.object({
  bbox: z.object({
    w: z.number(),
    s: z.number(),
    e: z.number(),
    n: z.number(),
  }),
  zoom: z.number().optional(),
  filters: z.object({
    types: z.array(z.string()).optional(),
    maxAgeMinutes: z.number().optional(),
    minConfidence: z.number().optional(),
    includeJams: z.boolean().optional(),
  }).optional(),
})

// Clean HTML tags and normalize whitespace
function cleanText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
    const endpoint = process.env.OPENWEBNINJA_WAZE_ENDPOINT || '/api/waze/alerts'
    const url = new URL(endpoint, Env.OPENWEBNINJA_BASE_URL)

    url.searchParams.set('w', String(body.bbox.w))
    url.searchParams.set('s', String(body.bbox.s))
    url.searchParams.set('e', String(body.bbox.e))
    url.searchParams.set('n', String(body.bbox.n))

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

    // Call OpenWebNinja Waze API
    const owResp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${Env.OPENWEBNINJA_API_KEY}` },
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

    // Insert scan record
    const scanResult = await db
      .insert(trafficScan)
      .values({
        bboxW: body.bbox.w,
        bboxS: body.bbox.s,
        bboxE: body.bbox.e,
        bboxN: body.bbox.n,
        zoom: body.zoom ?? null,
        totalAlerts: alerts.length,
        totalJams: jams.length,
        requestMeta: JSON.stringify(body.filters ?? {}),
        feedHealth: JSON.stringify({ ms: Date.now() - started }),
      })
      .returning({ id: trafficScan.id })

    const scanId = scanResult[0].id

    // Process alerts and jams
    const upsertItem = async (item: any, kind: 'alert' | 'jam') => {
      const sourceEventId = String(item.alert_id ?? item.jam_id ?? item.id ?? '')
      if (!sourceEventId) return

      const lat = Number(item.latitude ?? item.lat)
      const lon = Number(item.longitude ?? item.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return

      const published = item.publish_datetime_utc ?? item.published_at ?? item.time ?? null
      const description = cleanText(item.description ?? item.text ?? '')

      try {
        await db
          .insert(trafficEvent)
          .values({
            source: 'openwebninja_waze',
            sourceEventId,
            eventKind: kind,
            eventType: String(item.type ?? kind).toUpperCase(),
            subtype: String(item.subtype ?? ''),
            publishedAtUtc: published ? new Date(published) : null,
            lat,
            lon,
            country: String(item.country ?? ''),
            city: String(item.city ?? ''),
            street: String(item.street ?? ''),
            confidence: item.alert_confidence ?? item.confidence ?? null,
            reliability: item.alert_reliability ?? item.reliability ?? null,
            thumbsUp: item.num_thumbs_up ?? null,
            descriptionClean: description,
            officialLink: String(item.link ?? item.url ?? ''),
            raw: JSON.stringify(item),
            lastSeenAt: new Date(),
            lastScanId: scanId,
          })
          .onConflictDoUpdate({
            target: [trafficEvent.source, trafficEvent.sourceEventId],
            set: {
              lastSeenAt: new Date(),
              lastScanId: scanId,
              confidence: item.alert_confidence ?? item.confidence ?? null,
              reliability: item.alert_reliability ?? item.reliability ?? null,
              thumbsUp: item.num_thumbs_up ?? null,
              descriptionClean: description,
            },
          })
      } catch (error) {
        console.error('Failed to upsert traffic event:', error)
      }
    }

    // Upsert all alerts and jams
    await Promise.all([
      ...alerts.map((a: any) => upsertItem(a, 'alert')),
      ...jams.map((j: any) => upsertItem(j, 'jam')),
    ])

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

    return res.status(200).json({
      status: 'ok',
      source: 'openwebninja_waze',
      scan: {
        id: scanId,
        bboxW: body.bbox.w,
        bboxS: body.bbox.s,
        bboxE: body.bbox.e,
        bboxN: body.bbox.n,
        counts: { alerts: alerts.length, jams: jams.length },
      },
      geojson: geoJSON,
      meta: { ms: Date.now() - started },
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
