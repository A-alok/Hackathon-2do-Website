import { resend, FROM_EMAIL } from "./resend"
import { createClient } from "@supabase/supabase-js"

// Create admin client for cron jobs (bypasses RLS)
function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  userId?: string
  notificationType?: string
}

export async function sendEmail({ to, subject, html, userId, notificationType }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    // Log the notification if we have user context
    if (userId && notificationType) {
      const supabase = getAdminClient()
      await supabase.from("notification_logs").insert({
        user_id: userId,
        type: notificationType,
        channel: "email",
        status: error ? "failed" : "sent",
        metadata: { subject, error: error?.message },
      })
    }

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Email send error:", err)
    return { success: false, error: err }
  }
}

export async function sendBulkEmails(emails: SendEmailParams[]) {
  const results = await Promise.allSettled(emails.map((email) => sendEmail(email)))

  const sent = results.filter((r) => r.status === "fulfilled" && r.value.success).length
  const failed = results.length - sent

  return { sent, failed, total: results.length }
}
