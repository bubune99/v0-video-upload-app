"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, StickyNote, Brain, Trash2, X, Check } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Video {
  id: number
  title: string
  description: string
  blob_url: string
  duration: number
  created_at: string
}

interface Note {
  id: number
  timestamp: number
  note: string
  created_at: string
}

interface Quiz {
  id: number
  timestamp: number
  question: string
  options: string[]
  correct_answer: number
  created_at: string
}

interface VideoPlayerProps {
  videoId: string
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  const [video, setVideo] = useState<Video | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddQuiz, setShowAddQuiz] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetchVideoData()
  }, [videoId])

  useEffect(() => {
    if (isPlaying && Math.abs(currentTime - lastCheckedTime) > 0.5) {
      const quiz = quizzes.find((q) => Math.abs(q.timestamp - currentTime) < 0.5 && q.timestamp > lastCheckedTime)
      if (quiz && !activeQuiz) {
        setActiveQuiz(quiz)
        setSelectedAnswer(null)
        setQuizSubmitted(false)
        if (videoRef.current) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      }
      setLastCheckedTime(currentTime)
    }
  }, [currentTime, quizzes, isPlaying, lastCheckedTime, activeQuiz])

  const fetchVideoData = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`)
      const data = await response.json()
      setVideo(data.video)
      setNotes(data.notes)
      setQuizzes(data.quizzes)
    } catch (error) {
      console.error("Error fetching video:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0]
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const jumpToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      setCurrentTime(timestamp)
    }
  }

  const deleteNote = async (noteId: number) => {
    try {
      await fetch(`/api/notes?id=${noteId}`, {
        method: "DELETE",
      })
      fetchVideoData()
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const deleteQuiz = async (quizId: number) => {
    try {
      await fetch(`/api/quizzes?id=${quizId}`, {
        method: "DELETE",
      })
      fetchVideoData()
    } catch (error) {
      console.error("Error deleting quiz:", error)
    }
  }

  const handleQuizSubmit = () => {
    if (selectedAnswer !== null) {
      setQuizSubmitted(true)
    }
  }

  const closeQuiz = () => {
    setActiveQuiz(null)
    setSelectedAnswer(null)
    setQuizSubmitted(false)
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!video) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Video not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                src={video.blob_url}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />

              {activeQuiz && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
                  <Card className="max-w-lg w-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Quiz Time!</h3>
                        </div>
                        <Button size="icon" variant="ghost" onClick={closeQuiz}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-lg mb-6">{activeQuiz.question}</p>

                      <RadioGroup
                        value={selectedAnswer?.toString()}
                        onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}
                        disabled={quizSubmitted}
                      >
                        <div className="space-y-3">
                          {activeQuiz.options.map((option, index) => {
                            const isCorrect = index === activeQuiz.correct_answer
                            const isSelected = selectedAnswer === index
                            const showFeedback = quizSubmitted

                            return (
                              <div
                                key={index}
                                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                                  showFeedback
                                    ? isCorrect
                                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                                      : isSelected
                                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                                        : "border-border"
                                    : isSelected
                                      ? "border-primary bg-accent"
                                      : "border-border hover:border-primary/50"
                                }`}
                              >
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-normal">
                                  {option}
                                </Label>
                                {showFeedback && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                                {showFeedback && isSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                              </div>
                            )
                          })}
                        </div>
                      </RadioGroup>

                      {quizSubmitted && (
                        <div
                          className={`mt-4 p-4 rounded-lg ${
                            selectedAnswer === activeQuiz.correct_answer
                              ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                              : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
                          }`}
                        >
                          <p className="font-medium">
                            {selectedAnswer === activeQuiz.correct_answer
                              ? "Correct! Well done!"
                              : "Incorrect. The correct answer is highlighted above."}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-6">
                        {!quizSubmitted ? (
                          <Button onClick={handleQuizSubmit} disabled={selectedAnswer === null} className="flex-1">
                            Submit Answer
                          </Button>
                        ) : (
                          <Button onClick={closeQuiz} className="flex-1">
                            Continue Watching
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <div className="w-24">
                    <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} />
                  </div>

                  <Button size="icon" variant="ghost" onClick={toggleFullscreen}>
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
            {video.description && <p className="text-muted-foreground">{video.description}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Timeline</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddNote(true)} className="gap-2">
                  <StickyNote className="h-4 w-4" />
                  Add Note
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddQuiz(true)} className="gap-2">
                  <Brain className="h-4 w-4" />
                  Add Quiz
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {[...notes, ...quizzes]
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((item) => {
                  const isNote = "note" in item
                  return (
                    <div
                      key={`${isNote ? "note" : "quiz"}-${item.id}`}
                      className="group flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div
                        className="flex-shrink-0 w-16 text-sm font-mono text-primary cursor-pointer hover:underline"
                        onClick={() => jumpToTimestamp(item.timestamp)}
                      >
                        {formatTime(item.timestamp)}
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => jumpToTimestamp(item.timestamp)}>
                        {isNote ? (
                          <div className="flex items-start gap-2">
                            <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{(item as Note).note}</p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium mb-1">{(item as Quiz).question}</p>
                              <p className="text-xs text-muted-foreground">Quiz Question</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => {
                          if (isNote) {
                            deleteNote(item.id)
                          } else {
                            deleteQuiz(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}

              {notes.length === 0 && quizzes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No notes or quizzes yet. Add some to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {showAddNote && (
          <Card className="border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Add Note at {formatTime(currentTime)}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-input">Note Content</Label>
                  <Textarea id="note-input" className="min-h-24 mt-2" placeholder="Enter your note here..." />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const noteInput = document.getElementById("note-input") as HTMLTextAreaElement
                      if (noteInput.value.trim()) {
                        await fetch("/api/notes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            videoId: video.id,
                            timestamp: currentTime,
                            note: noteInput.value,
                          }),
                        })
                        noteInput.value = ""
                        setShowAddNote(false)
                        fetchVideoData()
                      }
                    }}
                  >
                    Save Note
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddQuiz && (
          <Card className="border-purple-200 dark:border-purple-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Add Quiz at {formatTime(currentTime)}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quiz-question">Question</Label>
                  <Input id="quiz-question" placeholder="Enter your question" className="mt-2" />
                </div>
                <div>
                  <Label>Answer Options</Label>
                  <div className="space-y-2 mt-2">
                    <Input id="quiz-option-0" placeholder="Option 1" />
                    <Input id="quiz-option-1" placeholder="Option 2" />
                    <Input id="quiz-option-2" placeholder="Option 3" />
                    <Input id="quiz-option-3" placeholder="Option 4" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="quiz-correct">Correct Answer</Label>
                  <select className="w-full p-2 rounded-md border bg-background mt-2" id="quiz-correct">
                    <option value="0">Option 1</option>
                    <option value="1">Option 2</option>
                    <option value="2">Option 3</option>
                    <option value="3">Option 4</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const question = (document.getElementById("quiz-question") as HTMLInputElement).value
                      const options = [
                        (document.getElementById("quiz-option-0") as HTMLInputElement).value,
                        (document.getElementById("quiz-option-1") as HTMLInputElement).value,
                        (document.getElementById("quiz-option-2") as HTMLInputElement).value,
                        (document.getElementById("quiz-option-3") as HTMLInputElement).value,
                      ]
                      const correctAnswer = Number.parseInt(
                        (document.getElementById("quiz-correct") as HTMLSelectElement).value,
                      )

                      if (question.trim() && options.every((opt) => opt.trim())) {
                        await fetch("/api/quizzes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            videoId: video.id,
                            timestamp: currentTime,
                            question,
                            options,
                            correctAnswer,
                          }),
                        })
                        setShowAddQuiz(false)
                        fetchVideoData()
                      }
                    }}
                  >
                    Save Quiz
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddQuiz(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
