"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskStatusSelectProps {
  taskId: string
  currentStatus: "todo" | "doing" | "done"
}

export function TaskStatusSelect({ taskId, currentStatus }: TaskStatusSelectProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: "todo" | "doing" | "done") => {
    if (newStatus === status) return

    setIsLoading(true)
    setStatus(newStatus)

    const supabase = createClient()
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

    setIsLoading(false)
    router.refresh()
  }

  const statuses = [
    { value: "todo", label: "To Do", icon: Circle },
    { value: "doing", label: "In Progress", icon: Clock },
    { value: "done", label: "Done", icon: CheckCircle2 },
  ] as const

  return (
    <div className="flex gap-2">
      {statuses.map((s) => (
        <Button
          key={s.value}
          variant={status === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange(s.value)}
          disabled={isLoading}
          className={cn(
            "gap-2",
            status === s.value && s.value === "done" && "bg-success text-success-foreground hover:bg-success/90",
          )}
        >
          <s.icon className="w-4 h-4" />
          {s.label}
        </Button>
      ))}
    </div>
  )
}
