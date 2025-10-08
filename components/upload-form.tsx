"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import type { PutBlobResult } from "@vercel/blob"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadIcon, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function UploadForm() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validate file type
      if (!selectedFile.type.startsWith("video/")) {
        alert("Please select a video file")
        return
      }

      const fileSizeMB = selectedFile.size / 1024 / 1024

      if (fileSizeMB > 500) {
        alert("File size too large. Maximum size is 500MB")
        return
      }

      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title) {
      alert("Please provide a video file and title")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      console.log("[v0] Starting upload for:", file.name)
      console.log("[v0] File size:", (file.size / 1024 / 1024).toFixed(2), "MB")

      const blob: PutBlobResult = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-video",
        clientPayload: JSON.stringify({
          title,
          description,
        }),
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage)
          console.log("[v0] Progress:", percentage + "%")
        },
      })

      console.log("[v0] Upload successful:", blob.url)

      let retries = 3
      let video = null

      while (retries > 0 && !video) {
        try {
          const response = await fetch(`/api/videos?url=${encodeURIComponent(blob.url)}`)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const data = await response.json()
          video = data.video

          if (!video && retries > 1) {
            console.log("[v0] Video not found yet, retrying...")
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (queryError) {
          console.error("[v0] Query error:", queryError)
          if (retries === 1) throw queryError
        }
        retries--
      }

      if (video?.id) {
        console.log("[v0] Navigating to video:", video.id)
        router.push(`/video/${video.id}`)
      } else {
        console.log("[v0] Video uploaded but not found in database, redirecting home")
        alert("Video uploaded successfully! Redirecting to home page.")
        router.push("/")
      }
    } catch (error) {
      console.error("[v0] Upload failed:", error)

      let errorMessage = "Failed to upload video. Please try again."

      if (error instanceof Error) {
        console.error("[v0] Error details:", error.message)

        // Handle specific error types
        if (error.message.includes("token") || error.message.includes("Authentication")) {
          errorMessage = "Upload authentication failed. Please refresh the page and try again."
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("size") || error.message.includes("413")) {
          errorMessage = "File is too large. Please try a smaller video file."
        } else if (error.message.includes("type") || error.message.includes("content")) {
          errorMessage = "Invalid file type. Please upload a video file."
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      alert(`Upload Error: ${errorMessage}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Details</CardTitle>
        <CardDescription>Upload your video and provide details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter video description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                required
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button type="submit" disabled={isUploading} className="w-full gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress > 0 && uploadProgress < 100 ? "Uploading..." : "Processing..."}
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
