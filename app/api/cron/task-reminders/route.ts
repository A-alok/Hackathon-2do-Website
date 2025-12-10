import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send"
import { taskDeadlineEmail } from "@/lib/email/templates"
import type { Profile } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date()

  try {
    // Get tasks with deadlines in the next 48 hours or overdue (not completed)
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: tasks, error: taskError } = await supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(*)")
      .neq("status", "done")
      .not("assigned_to", "is", null)
      .not("deadline", "is", null)
      .gte("deadline", oneDayAgo.toISOString())
      .lte("deadline", twoDaysFromNow.toISOString())

    if (taskError) throw taskError

    let emailsSent = 0
    const errors: string[] = []

    for (const task of tasks || []) {
      const assignee = task.assignee as Profile
      if (!assignee?.notifications_email || !assignee?.email) continue

      const deadline = new Date(task.deadline)
      const hoursUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))

      // Determine reminder type: 24 hours, 2 hours, or overdue
      let reminderType: string | null = null

      if (hoursUntil < 0 && hoursUntil >= -24) {
        reminderType = "task_overdue"
      } else if (hoursUntil >= 0 && hoursUntil <= 2) {
        reminderType = "task_2h"
      } else if (hoursUntil > 2 && hoursUntil <= 26) {
        reminderType = "task_24h"
      }

      if (!reminderType) continue

      // Check if already sent today
      const { data: existingLog } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("user_id", task.assigned_to)
        .eq("type", reminderType)
        .gte("created_at", new Date(now.setHours(0, 0, 0, 0)).toISOString())
        .single()

      if (existingLog) continue

      const { subject, html } = taskDeadlineEmail(task, hoursUntil)
      const result = await sendEmail({
        to: assignee.email,
        subject,
        html,
        userId: task.assigned_to,
        notificationType: reminderType,
      })

      if (result.success) emailsSent++
      else errors.push(`Failed to send to ${assignee.email}`)
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Task reminder cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
