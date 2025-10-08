import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { videoId, timestamp, question, options, correctAnswer } = await request.json()

    if (!videoId || timestamp === undefined || !question || !options || correctAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO quizzes (video_id, timestamp, question, options, correct_answer)
      VALUES (${videoId}, ${timestamp}, ${question}, ${JSON.stringify(options)}, ${correctAnswer})
      RETURNING id, video_id, timestamp, question, options, correct_answer, created_at
    `

    return NextResponse.json({ quiz: result[0] })
  } catch (error) {
    console.error("Error creating quiz:", error)
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM quizzes WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}
