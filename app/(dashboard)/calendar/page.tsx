import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import type { Hackathon, Task, Profile } from "@/lib/types"
import { CalendarNavigation } from "@/components/calendar/calendar-navigation"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Parse current month from URL or use current date
  const currentDate = new Date()
  const year = params.year ? Number.parseInt(params.year) : currentDate.getFullYear()
  const month = params.month ? Number.parseInt(params.month) - 1 : currentDate.getMonth()
  const viewDate = new Date(year, month, 1)

  // Get user's teams
  const { data: teamMembers } = await supabase.from("team_members").select("team_id").eq("user_id", user.id)

  const teamIds = teamMembers?.map((tm) => tm.team_id) || []

  if (teamIds.length === 0) {
    redirect("/dashboard")
  }

  // Fetch hackathons and tasks for the current month range
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)

  const { data: hackathons } = await supabase.from("hackathons").select("*").in("team_id", teamIds)

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:assigned_to(id, name, email)")
    .in("team_id", teamIds)
    .not("deadline", "is", null)

  const hackathonList = (hackathons || []) as Hackathon[]
  const taskList = (tasks || []) as (Task & { assignee: Profile | null })[]

  // Generate calendar days
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    const events: { type: "hackathon" | "task"; title: string; subtype?: string }[] = []

    hackathonList.forEach((h) => {
      if (h.reg_deadline && isSameDay(new Date(h.reg_deadline), day)) {
        events.push({ type: "hackathon", title: h.title, subtype: "Registration" })
      }
      if (h.submission_deadline && isSameDay(new Date(h.submission_deadline), day)) {
        events.push({ type: "hackathon", title: h.title, subtype: "Submission" })
      }
      if (h.start_date && isSameDay(new Date(h.start_date), day)) {
        events.push({ type: "hackathon", title: h.title, subtype: "Starts" })
      }
      if (h.end_date && isSameDay(new Date(h.end_date), day)) {
        events.push({ type: "hackathon", title: h.title, subtype: "Ends" })
      }
    })

    taskList.forEach((t) => {
      if (t.deadline && isSameDay(new Date(t.deadline), day)) {
        events.push({ type: "task", title: t.title })
      }
    })

    return events
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">View all deadlines in one place</p>
        </div>
        <CalendarNavigation currentDate={viewDate} />
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{format(viewDate, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="min-h-24 p-1 rounded-lg bg-muted/30" />
            ))}

            {/* Actual days */}
            {days.map((day) => {
              const events = getEventsForDay(day)
              const dayIsToday = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-1 rounded-lg border transition-colors ${
                    dayIsToday ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 px-1 ${dayIsToday ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          event.type === "hackathon" ? "bg-chart-1/20 text-chart-1" : "bg-info/20 text-info"
                        }`}
                        title={event.subtype ? `${event.title} - ${event.subtype}` : event.title}
                      >
                        {event.type === "hackathon" ? (
                          <span>
                            {event.subtype}: {event.title}
                          </span>
                        ) : (
                          event.title
                        )}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">+{events.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Empty cells for days after month ends */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="min-h-24 p-1 rounded-lg bg-muted/30" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chart-1/40" />
          <span className="text-sm text-muted-foreground">Hackathon Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-info/40" />
          <span className="text-sm text-muted-foreground">Task Deadlines</span>
        </div>
      </div>
    </div>
  )
}
