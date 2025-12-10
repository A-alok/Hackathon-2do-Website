"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, User } from "lucide-react"
import { formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

interface TaskItemProps {
  task: Task
  onClick?: () => void
}

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

export function TaskItem({ task, onClick }: TaskItemProps) {
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done"

  return (
    <div
      className={cn(
        "p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
        isOverdue && "border-destructive/50",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                "font-medium truncate",
                task.status === "done" ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {task.title}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            <Badge variant="secondary" className={statusColors[task.status]}>
              {task.status === "todo" ? "To Do" : task.status === "doing" ? "In Progress" : "Done"}
            </Badge>
            {task.deadline && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        {task.assignee ? (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {task.assignee.name?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
