export interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: "admin" | "member"
  notifications_email: boolean
  notifications_whatsapp: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  invite_code: string
  created_at: string
  created_by: string | null
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  profile?: Profile
}

export interface Hackathon {
  id: string
  title: string
  organizer: string | null
  start_date: string | null
  end_date: string | null
  reg_deadline: string | null
  submission_deadline: string | null
  link: string | null
  notifications_enabled: boolean
  team_id: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string | null
  deadline: string | null
  priority: "low" | "medium" | "high"
  status: "todo" | "doing" | "done"
  team_id: string
  created_at: string
  updated_at: string
  assignee?: Profile
  creator?: Profile
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}
