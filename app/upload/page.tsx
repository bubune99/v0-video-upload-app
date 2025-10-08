import { UploadForm } from "@/components/upload-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Videos
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Upload Video</h1>
          <p className="text-muted-foreground mb-8">Upload a video to add timestamp notes and interactive quizzes</p>

          <UploadForm />
        </div>
      </div>
    </main>
  )
}
