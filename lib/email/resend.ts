import { Resend } from "resend"

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)

// Default from address - update this to your verified domain
export const FROM_EMAIL = process.env.FROM_EMAIL || "HackNotify <notifications@hacknotify.com>"
