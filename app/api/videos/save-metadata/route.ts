import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { title, description, blobUrl } = await request.json()

    if (!title || !blobUrl) {
      return NextResponse.json({ error: "Title and blob URL are required" }, { status: 400 })
    }

    console.log("[v0] Saving video metadata to database")

    const result = await sql`
      INSERT INTO videos (title, description, blob_url)
      VALUES (${title}, ${description || null}, ${blobUrl})
      RETURNING id, title, description, blob_url, created_at
    `

    const video = result[0]
    console.log("[v0] Video saved to database:", video.id)

    return NextResponse.json({ video })
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save video metadata" },
      { status: 500 },
    )
  }
}
