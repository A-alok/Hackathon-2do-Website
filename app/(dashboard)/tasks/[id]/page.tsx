import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, User, Clock, Edit } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import type { Task, Profile, TaskComment } from "@/lib/types"
import { TaskComments } from "@/components/tasks/task-comments"
import { TaskStatusSelect } from "@/components/tasks/task-status-select"

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/20 text-chart-4",
  high: "bg-destructive/20 text-destructive",
}

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  doing: "bg-info/20 text-info",
  done: "bg-success/20 text-success",
}

const statusLabels = {
  todo: "To Do",
  doing: "In Progress",
  done: "Done",
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Fetch task with assignee and creator
  const { data: task } = await supabase
    .from("tasks")
    .select("*, assignee:assigned_to(id, name, email), creator:created_by(id, name, email)")
    .eq("id", id)
    .single()

  if (!task) notFound()

  // Fetch comments
  const { data: comments } = await supabase
    .from("task_comments")
    .select("*, user:user_id(id, name, email)")
    .eq("task_id", id)
    .order("created_at", { ascending: true })

  const taskData = task as Task & { assignee: Profile | null; creator: Profile | null }
  const commentsData = (comments || []) as (TaskComment & { user: Profile })[]

  const isOverdue = taskData.deadline && isPast(new Date(taskData.deadline)) && taskData.status !== "done"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle
                    className={cn("text-xl", taskData.status === "done" && "line-through text-muted-foreground")}
                  >
                    {taskData.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Created {formatDistanceToNow(new Date(taskData.created_at), { addSuffix: true })}
                    {taskData.creator && ` by ${taskData.creator.name || taskData.creator.email}`}
                  </CardDescription>
                </div>
                <Link href={`/tasks/${id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status & Priority */}
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[taskData.status]} variant="secondary">
                  {statusLabels[taskData.status]}
                </Badge>
                <Badge className={priorityColors[taskData.priority]} variant="secondary">
                  {taskData.priority} priority
                </Badge>
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>

              {/* Description */}
              {taskData.description && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{taskData.description}</p>
                </div>
              )}

              {/* Quick Status Update */}
              <div>
                <h3 className="font-medium text-foreground mb-2">Update Status</h3>
                <TaskStatusSelect taskId={taskData.id} currentStatus={taskData.status} />
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <TaskComments taskId={taskData.id} comments={commentsData} currentUserId={user.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned to</p>
                {taskData.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {taskData.assignee.name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{taskData.assignee.name || taskData.assignee.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Unassigned</span>
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                {taskData.deadline ? (
                  <div className={cn("flex items-center gap-2", isOverdue ? "text-destructive" : "text-foreground")}>
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{format(new Date(taskData.deadline), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(taskData.deadline), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No deadline set</span>
                )}
              </div>

              {/* Last Updated */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last updated</p>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(taskData.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
