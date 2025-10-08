import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request): Promise<NextResponse> {
  console.log("[v0] Upload API route called")
  console.log("[v0] BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN)

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[v0] BLOB_READ_WRITE_TOKEN is not set")
    return NextResponse.json(
      { error: "Blob storage is not configured. Please check your environment variables." },
      { status: 500 },
    )
  }

  try {
    const body = (await request.json()) as HandleUploadBody
    console.log("[v0] Request body parsed successfully")

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log("[v0] Generating token for:", pathname)

        let parsedPayload = { title: "Untitled Video", description: "" }
        if (clientPayload) {
          try {
            parsedPayload = JSON.parse(clientPayload as string)
          } catch (e) {
            console.warn("[v0] Failed to parse client payload, using defaults")
          }
        }

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/ogg",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(parsedPayload),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[v0] Upload completed, saving to database")

        try {
          const payload = JSON.parse(tokenPayload)
          const { title, description } = payload

          const result = await sql`
            INSERT INTO videos (title, description, blob_url, created_at)
            VALUES (${title}, ${description}, ${blob.url}, NOW())
            RETURNING id, title, description, blob_url, created_at
          `

          console.log("[v0] Video saved successfully with ID:", result[0].id)
        } catch (dbError) {
          console.error("[v0] Database error:", dbError)
          console.error("[v0] Failed to save video metadata for:", blob.url)
          // Don't throw here - the upload succeeded, just log the error
        }
      },
    })

    console.log("[v0] Upload process completed successfully")
    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("[v0] Upload error occurred:", error)

    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error name:", error.name)

      // Handle specific Blob SDK errors
      if (error.message.includes("token")) {
        return NextResponse.json(
          { error: "Authentication failed. Please check Blob storage configuration." },
          { status: 401 },
        )
      }

      if (error.message.includes("content type")) {
        return NextResponse.json({ error: "Invalid file type. Please upload a video file." }, { status: 400 })
      }

      if (error.message.includes("size")) {
        return NextResponse.json({ error: "File size exceeds the maximum allowed limit." }, { status: 413 })
      }

      return NextResponse.json({ error: error.message || "Upload failed. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ error: "An unexpected error occurred during upload." }, { status: 500 })
  }
}
