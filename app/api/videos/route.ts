import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const blobUrl = searchParams.get("url")

    if (blobUrl) {
      // Query by specific blob URL
      const videos = await sql`
        SELECT id, title, description, blob_url, duration, created_at
        FROM videos
        WHERE blob_url = ${blobUrl}
        ORDER BY created_at DESC
      `
      return NextResponse.json(videos)
    }

    // Default: return all videos
    const videos = await sql`
      SELECT id, title, description, blob_url, duration, created_at
      FROM videos
      ORDER BY created_at DESC
    `

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}
