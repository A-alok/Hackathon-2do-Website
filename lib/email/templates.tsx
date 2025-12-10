import type { Hackathon, Task, Profile } from "@/lib/types"

// Helper to format dates nicely
function formatDate(date: string | null): string {
  if (!date) return "Not set"
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(date: string | null): string {
  if (!date) return "Not set"
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Base email wrapper
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; overflow: hidden; border: 1px solid #262626;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">HackNotify</h1>
        </div>
        <div style="padding: 32px;">
          ${content}
        </div>
        <div style="padding: 16px 32px; background-color: #0a0a0a; text-align: center; font-size: 12px; color: #737373;">
          <p style="margin: 0;">You're receiving this because you enabled email notifications on HackNotify.</p>
          <p style="margin: 8px 0 0 0;">Manage your preferences in Settings.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Hackathon deadline reminder
export function hackathonDeadlineEmail(
  hackathon: Hackathon,
  deadlineType: "registration" | "submission",
  daysUntil: number,
): { subject: string; html: string } {
  const deadline = deadlineType === "registration" ? hackathon.reg_deadline : hackathon.submission_deadline
  const deadlineLabel = deadlineType === "registration" ? "Registration Deadline" : "Submission Deadline"

  let urgencyText = ""
  let urgencyColor = "#f97316"

  if (daysUntil === 0) {
    urgencyText = "TODAY!"
    urgencyColor = "#ef4444"
  } else if (daysUntil === 1) {
    urgencyText = "Tomorrow"
    urgencyColor = "#ef4444"
  } else if (daysUntil <= 3) {
    urgencyText = `In ${daysUntil} days`
    urgencyColor = "#f97316"
  } else {
    urgencyText = `In ${daysUntil} days`
    urgencyColor = "#22c55e"
  }

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #fafafa;">Hackathon Deadline Reminder</h2>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #fafafa;">${hackathon.title}</h3>
      ${hackathon.organizer ? `<p style="margin: 0 0 16px 0; color: #a3a3a3;">by ${hackathon.organizer}</p>` : ""}
      
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="background-color: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ${urgencyText}
        </span>
      </div>
      
      <p style="margin: 16px 0 0 0; color: #fafafa;">
        <strong>${deadlineLabel}:</strong> ${formatDateTime(deadline)}
      </p>
    </div>
    
    ${
      hackathon.link
        ? `
      <a href="${hackathon.link}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Hackathon
      </a>
    `
        : ""
    }
  `

  return {
    subject: `${daysUntil === 0 ? "🚨 " : ""}${deadlineLabel} ${urgencyText.toLowerCase()} - ${hackathon.title}`,
    html: emailWrapper(content),
  }
}

// Task assigned notification
export function taskAssignedEmail(task: Task, assignedBy: Profile | null): { subject: string; html: string } {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #fafafa;">New Task Assigned to You</h2>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #fafafa;">${task.title}</h3>
      
      ${task.description ? `<p style="margin: 0 0 16px 0; color: #a3a3a3;">${task.description}</p>` : ""}
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <span style="background-color: ${
          task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f97316" : "#22c55e"
        }; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase;">
          ${task.priority} Priority
        </span>
      </div>
      
      ${
        task.deadline
          ? `
        <p style="margin: 0; color: #fafafa;">
          <strong>Due:</strong> ${formatDateTime(task.deadline)}
        </p>
      `
          : ""
      }
      
      ${
        assignedBy
          ? `
        <p style="margin: 8px 0 0 0; color: #a3a3a3; font-size: 14px;">
          Assigned by ${assignedBy.name || assignedBy.email}
        </p>
      `
          : ""
      }
    </div>
    
    <p style="color: #a3a3a3;">Log in to HackNotify to view and update this task.</p>
  `

  return {
    subject: `New task assigned: ${task.title}`,
    html: emailWrapper(content),
  }
}

// Task deadline reminder
export function taskDeadlineEmail(task: Task, hoursUntil: number): { subject: string; html: string } {
  let urgencyText = ""
  let urgencyColor = "#f97316"

  if (hoursUntil <= 0) {
    urgencyText = "OVERDUE"
    urgencyColor = "#ef4444"
  } else if (hoursUntil <= 2) {
    urgencyText = `Due in ${hoursUntil} hour${hoursUntil === 1 ? "" : "s"}`
    urgencyColor = "#ef4444"
  } else if (hoursUntil <= 24) {
    urgencyText = `Due in ${hoursUntil} hours`
    urgencyColor = "#f97316"
  } else {
    const days = Math.floor(hoursUntil / 24)
    urgencyText = `Due in ${days} day${days === 1 ? "" : "s"}`
    urgencyColor = "#22c55e"
  }

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #fafafa;">Task Deadline Reminder</h2>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;">
        <span style="background-color: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ${urgencyText}
        </span>
      </div>
      
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #fafafa;">${task.title}</h3>
      
      ${task.description ? `<p style="margin: 0 0 16px 0; color: #a3a3a3;">${task.description}</p>` : ""}
      
      <p style="margin: 0; color: #fafafa;">
        <strong>Deadline:</strong> ${formatDateTime(task.deadline)}
      </p>
    </div>
    
    <p style="color: #a3a3a3;">Log in to HackNotify to mark this task as complete.</p>
  `

  return {
    subject: `${hoursUntil <= 0 ? "🚨 OVERDUE: " : "⏰ "}${task.title}`,
    html: emailWrapper(content),
  }
}

// Daily summary email
export function dailySummaryEmail(
  userName: string,
  teamName: string,
  upcomingHackathons: Hackathon[],
  pendingTasks: Task[],
  overdueTasks: Task[],
): { subject: string; html: string } {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  let hackathonSection = ""
  if (upcomingHackathons.length > 0) {
    hackathonSection = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #f97316;">Upcoming Hackathon Deadlines</h3>
        ${upcomingHackathons
          .map(
            (h) => `
          <div style="background-color: #262626; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <strong style="color: #fafafa;">${h.title}</strong>
            ${h.reg_deadline ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #a3a3a3;">Registration: ${formatDate(h.reg_deadline)}</p>` : ""}
            ${h.submission_deadline ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #a3a3a3;">Submission: ${formatDate(h.submission_deadline)}</p>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  let overdueSection = ""
  if (overdueTasks.length > 0) {
    overdueSection = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ef4444;">Overdue Tasks (${overdueTasks.length})</h3>
        ${overdueTasks
          .map(
            (t) => `
          <div style="background-color: #262626; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 12px; margin-bottom: 8px;">
            <strong style="color: #fafafa;">${t.title}</strong>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #a3a3a3;">Was due: ${formatDate(t.deadline)}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  let tasksSection = ""
  if (pendingTasks.length > 0) {
    tasksSection = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #22c55e;">Your Pending Tasks (${pendingTasks.length})</h3>
        ${pendingTasks
          .slice(0, 5)
          .map(
            (t) => `
          <div style="background-color: #262626; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <strong style="color: #fafafa;">${t.title}</strong>
            ${t.deadline ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #a3a3a3;">Due: ${formatDate(t.deadline)}</p>` : ""}
          </div>
        `,
          )
          .join("")}
        ${pendingTasks.length > 5 ? `<p style="color: #a3a3a3; font-size: 14px;">...and ${pendingTasks.length - 5} more tasks</p>` : ""}
      </div>
    `
  }

  const emptyState =
    upcomingHackathons.length === 0 && pendingTasks.length === 0 && overdueTasks.length === 0
      ? `<p style="color: #22c55e; text-align: center; padding: 20px;">All clear! No pending items today.</p>`
      : ""

  const content = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #fafafa;">Good morning, ${userName}!</h2>
    <p style="margin: 0 0 24px 0; color: #a3a3a3;">${today} • Team: ${teamName}</p>
    
    ${overdueSection}
    ${hackathonSection}
    ${tasksSection}
    ${emptyState}
  `

  return {
    subject: `Your daily summary for ${today}`,
    html: emailWrapper(content),
  }
}

// Weekly summary email
export function weeklySummaryEmail(
  userName: string,
  teamName: string,
  stats: {
    tasksCompleted: number
    tasksCreated: number
    hackathonsAdded: number
    upcomingDeadlines: number
  },
  nextWeekHackathons: Hackathon[],
  nextWeekTasks: Task[],
): { subject: string; html: string } {
  const weekOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })

  const content = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #fafafa;">Weekly Summary</h2>
    <p style="margin: 0 0 24px 0; color: #a3a3a3;">Week of ${weekOf} • Team: ${teamName}</p>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background-color: #262626; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #22c55e;">${stats.tasksCompleted}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a3a3a3;">Tasks Completed</p>
      </div>
      <div style="background-color: #262626; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #f97316;">${stats.tasksCreated}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a3a3a3;">Tasks Created</p>
      </div>
      <div style="background-color: #262626; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #3b82f6;">${stats.hackathonsAdded}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a3a3a3;">Hackathons Added</p>
      </div>
      <div style="background-color: #262626; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ef4444;">${stats.upcomingDeadlines}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a3a3a3;">Upcoming Deadlines</p>
      </div>
    </div>
    
    ${
      nextWeekHackathons.length > 0
        ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #f97316;">Next Week's Hackathon Deadlines</h3>
        ${nextWeekHackathons
          .map(
            (h) => `
          <div style="background-color: #262626; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <strong style="color: #fafafa;">${h.title}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    
    ${
      nextWeekTasks.length > 0
        ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #22c55e;">Tasks Due Next Week (${nextWeekTasks.length})</h3>
        ${nextWeekTasks
          .slice(0, 5)
          .map(
            (t) => `
          <div style="background-color: #262626; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <strong style="color: #fafafa;">${t.title}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    
    <p style="color: #a3a3a3; text-align: center;">Keep up the great work, ${userName}!</p>
  `

  return {
    subject: `Weekly summary for ${teamName} - ${weekOf}`,
    html: emailWrapper(content),
  }
}
