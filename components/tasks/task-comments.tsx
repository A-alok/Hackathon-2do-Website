"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import type { TaskComment, Profile } from "@/lib/types"

interface TaskCommentsProps {
  taskId: string
  comments: (TaskComment & { user: Profile })[]
  currentUserId: string
}

export function TaskComments({ taskId, comments, currentUserId }: TaskCommentsProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)

    const supabase = createClient()
    await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: currentUserId,
      content: newComment.trim(),
    })

    setNewComment("")
    setIsSubmitting(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {comment.user.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {comment.user.name || comment.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-border">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
