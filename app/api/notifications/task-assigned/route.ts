import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send"
import { taskAssignedEmail } from "@/lib/email/templates"
import type { Profile, Task } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { taskId } = await request.json()

    // Get the task with assignee info
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*)")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const assignee = task.assignee as Profile
    const creator = task.creator as Profile

    if (!assignee?.notifications_email || !assignee?.email) {
      return NextResponse.json({ message: "Assignee has notifications disabled" })
    }

    const { subject, html } = taskAssignedEmail(task as Task, creator)
    const result = await sendEmail({
      to: assignee.email,
      subject,
      html,
      userId: assignee.id,
      notificationType: "task_assigned",
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Task notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
