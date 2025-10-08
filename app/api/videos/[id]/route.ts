import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const videos = await sql`
      SELECT id, title, description, blob_url, duration, created_at
      FROM videos
      WHERE id = ${id}
    `

    if (videos.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const notes = await sql`
      SELECT id, timestamp, note, created_at
      FROM timestamp_notes
      WHERE video_id = ${id}
      ORDER BY timestamp ASC
    `

    const quizzes = await sql`
      SELECT id, timestamp, question, options, correct_answer, created_at
      FROM quizzes
      WHERE video_id = ${id}
      ORDER BY timestamp ASC
    `

    return NextResponse.json({
      video: videos[0],
      notes,
      quizzes,
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
