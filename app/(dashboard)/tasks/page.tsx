"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CheckSquare, User, Calendar, MoreVertical, GripVertical } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Task, Profile } from "@/lib/types"

type TaskWithAssignee = Task & { assignee: Profile | null }

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/20 text-chart-4",
  high: "bg-destructive/20 text-destructive",
}

const statusLabels = {
  todo: "To Do",
  doing: "In Progress",
  done: "Done",
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"list" | "board">("board")
  const [userId, setUserId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: teamMembers } = await supabase.from("team_members").select("team_id").eq("user_id", user.id)

    const teamIds = teamMembers?.map((tm) => tm.team_id) || []

    if (teamIds.length === 0) {
      setIsLoading(false)
      return
    }

    const { data: taskData } = await supabase
      .from("tasks")
      .select("*, assignee:assigned_to(id, name, email)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })

    setTasks((taskData || []) as TaskWithAssignee[])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const updateTaskStatus = async (taskId: string, newStatus: "todo" | "doing" | "done") => {
    const supabase = createClient()

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

    if (error) {
      // Revert on error
      fetchTasks()
    }
  }

  const todoTasks = tasks.filter((t) => t.status === "todo")
  const doingTasks = tasks.filter((t) => t.status === "doing")
  const doneTasks = tasks.filter((t) => t.status === "done")
  const myTasks = tasks.filter((t) => t.assigned_to === userId && t.status !== "done")

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Loading tasks...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Manage and track team tasks</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "board")}>
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/tasks/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <CheckSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create tasks and assign them to team members
            </p>
            <Link href="/tasks/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Task
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : view === "board" ? (
        /* Kanban Board View */
        <div className="grid md:grid-cols-3 gap-4">
          <TaskColumn
            title="To Do"
            count={todoTasks.length}
            tasks={todoTasks}
            onStatusChange={updateTaskStatus}
            status="todo"
          />
          <TaskColumn
            title="In Progress"
            count={doingTasks.length}
            tasks={doingTasks}
            onStatusChange={updateTaskStatus}
            status="doing"
          />
          <TaskColumn
            title="Done"
            count={doneTasks.length}
            tasks={doneTasks}
            onStatusChange={updateTaskStatus}
            status="done"
          />
        </div>
      ) : (
        /* List View */
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="my">My Tasks ({myTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4 space-y-2">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onStatusChange={updateTaskStatus} />
            ))}
          </TabsContent>
          <TabsContent value="my" className="mt-4 space-y-2">
            {myTasks.length > 0 ? (
              myTasks.map((task) => <TaskRow key={task.id} task={task} onStatusChange={updateTaskStatus} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">No tasks assigned to you</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function TaskColumn({
  title,
  count,
  tasks,
  onStatusChange,
  status,
}: {
  title: string
  count: number
  tasks: TaskWithAssignee[]
  onStatusChange: (id: string, status: "todo" | "doing" | "done") => void
  status: "todo" | "doing" | "done"
}) {
  const bgColors = {
    todo: "bg-muted/30",
    doing: "bg-info/5",
    done: "bg-success/5",
  }

  return (
    <div className={cn("rounded-xl p-4", bgColors[status])}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
        ))}
        {tasks.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No tasks</div>}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: TaskWithAssignee
  onStatusChange: (id: string, status: "todo" | "doing" | "done") => void
}) {
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done"

  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", isOverdue && "border-destructive/50")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 cursor-grab" />
          <div className="flex-1 min-w-0">
            <Link href={`/tasks/${task.id}`}>
              <h4
                className={cn(
                  "font-medium text-sm hover:text-primary transition-colors",
                  task.status === "done" && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </h4>
            </Link>
            {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              {task.status !== "todo" && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>Move to To Do</DropdownMenuItem>
              )}
              {task.status !== "doing" && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "doing")}>
                  Move to In Progress
                </DropdownMenuItem>
              )}
              {task.status !== "done" && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "done")}>Mark as Done</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[task.priority]} variant="secondary">
              {task.priority}
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
          {task.assignee ? (
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {task.assignee.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskRow({
  task,
  onStatusChange,
}: {
  task: TaskWithAssignee
  onStatusChange: (id: string, status: "todo" | "doing" | "done") => void
}) {
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done"

  const statusColors = {
    todo: "bg-muted text-muted-foreground",
    doing: "bg-info/20 text-info",
    done: "bg-success/20 text-success",
  }

  return (
    <Card className={isOverdue ? "border-destructive/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/tasks/${task.id}`}>
                <h4
                  className={cn(
                    "font-medium hover:text-primary transition-colors",
                    task.status === "done" && "line-through text-muted-foreground",
                  )}
                >
                  {task.title}
                </h4>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={priorityColors[task.priority]} variant="secondary">
                {task.priority}
              </Badge>
              <Badge className={statusColors[task.status]} variant="secondary">
                {statusLabels[task.status]}
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

          <div className="flex items-center gap-3">
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {task.assignee.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${task.id}`}>View Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
                {task.status !== "todo" && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>Move to To Do</DropdownMenuItem>
                )}
                {task.status !== "doing" && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "doing")}>
                    Move to In Progress
                  </DropdownMenuItem>
                )}
                {task.status !== "done" && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "done")}>Mark as Done</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
