import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VideoList } from "@/components/video-list"
import { Upload } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Video Learning Platform</h1>
            <p className="text-muted-foreground">Upload videos, add notes, and create interactive quizzes</p>
          </div>
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Upload Video
            </Button>
          </Link>
        </div>

        <VideoList />
      </div>
    </main>
  )
}
