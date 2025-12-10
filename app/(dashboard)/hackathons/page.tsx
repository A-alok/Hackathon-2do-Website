import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trophy, Calendar, ExternalLink, Bell, BellOff, MoreVertical } from "lucide-react"
import Link from "next/link"
import { format, isPast, isFuture, formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Hackathon } from "@/lib/types"

export default async function HackathonsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get user's teams
  const { data: teamMembers } = await supabase.from("team_members").select("team_id").eq("user_id", user.id)

  const teamIds = teamMembers?.map((tm) => tm.team_id) || []

  if (teamIds.length === 0) {
    redirect("/dashboard")
  }

  // Fetch hackathons
  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .in("team_id", teamIds)
    .order("submission_deadline", { ascending: true })

  const hackathonList = (hackathons || []) as Hackathon[]
  const now = new Date()

  // Categorize hackathons
  const upcoming = hackathonList.filter((h) => {
    const subDeadline = h.submission_deadline ? new Date(h.submission_deadline) : null
    return subDeadline && isFuture(subDeadline)
  })

  const past = hackathonList.filter((h) => {
    const subDeadline = h.submission_deadline ? new Date(h.submission_deadline) : null
    return subDeadline && isPast(subDeadline)
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hackathons</h1>
          <p className="text-muted-foreground">Track all your hackathon deadlines</p>
        </div>
        <Link href="/hackathons/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Hackathon
          </Button>
        </Link>
      </div>

      {hackathonList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No hackathons yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Start tracking hackathons to receive automatic deadline reminders
            </p>
            <Link href="/hackathons/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Hackathon
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Hackathons */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming ({upcoming.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((hackathon) => (
                  <HackathonCard key={hackathon.id} hackathon={hackathon} />
                ))}
              </div>
            </section>
          )}

          {/* Past Hackathons */}
          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">Past ({past.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {past.map((hackathon) => (
                  <HackathonCard key={hackathon.id} hackathon={hackathon} isPast />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function HackathonCard({ hackathon, isPast = false }: { hackathon: Hackathon; isPast?: boolean }) {
  const now = new Date()
  const regDeadline = hackathon.reg_deadline ? new Date(hackathon.reg_deadline) : null
  const subDeadline = hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : null

  const getDeadlineStatus = (deadline: Date | null) => {
    if (!deadline) return null
    if (isPast) return "past"
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 0) return "overdue"
    if (daysUntil <= 1) return "urgent"
    if (daysUntil <= 3) return "soon"
    if (daysUntil <= 7) return "upcoming"
    return "normal"
  }

  const subStatus = getDeadlineStatus(subDeadline)

  return (
    <Card className={isPast ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/hackathons/${hackathon.id}`} className="hover:underline">
              <CardTitle className="text-base truncate">{hackathon.title}</CardTitle>
            </Link>
            {hackathon.organizer && <CardDescription className="truncate">{hackathon.organizer}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/hackathons/${hackathon.id}`}>
              <Button size="sm" variant="secondary" className="h-8">
                Open
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/hackathons/${hackathon.id}`}>Open Command Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/hackathons/${hackathon.id}/edit`}>Edit Details</Link>
                </DropdownMenuItem>
                {hackathon.link && (
                  <DropdownMenuItem asChild>
                    <Link href={hackathon.link} target="_blank">
                      Visit Website
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Dates */}
        {hackathon.start_date && hackathon.end_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(hackathon.start_date), "MMM d")} - {format(new Date(hackathon.end_date), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Deadlines */}
        <div className="space-y-2">
          {regDeadline && (
            <DeadlineRow label="Registration" date={regDeadline} status={getDeadlineStatus(regDeadline)} />
          )}
          {subDeadline && <DeadlineRow label="Submission" date={subDeadline} status={subStatus} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {hackathon.notifications_enabled ? (
              <>
                <Bell className="w-4 h-4" />
                <span>Reminders on</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Reminders off</span>
              </>
            )}
          </div>
          {hackathon.link && (
            <Link
              href={hackathon.link}
              target="_blank"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DeadlineRow({ label, date, status }: { label: string; date: Date; status: string | null }) {
  const statusStyles = {
    overdue: "text-destructive",
    urgent: "text-warning",
    soon: "text-chart-4",
    upcoming: "text-info",
    normal: "text-muted-foreground",
    past: "text-muted-foreground",
  }

  const badgeStyles = {
    overdue: "bg-destructive/20 text-destructive",
    urgent: "bg-warning/20 text-warning",
    soon: "bg-chart-4/20 text-chart-4",
    upcoming: "",
    normal: "",
    past: "",
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={statusStyles[status as keyof typeof statusStyles] || "text-muted-foreground"}>
          {status === "past" ? format(date, "MMM d, yyyy") : formatDistanceToNow(date, { addSuffix: true })}
        </span>
        {status && ["overdue", "urgent", "soon"].includes(status) && (
          <Badge className={badgeStyles[status as keyof typeof badgeStyles]}>
            {status === "overdue" ? "Overdue" : status === "urgent" ? "Today" : "Soon"}
          </Badge>
        )}
      </div>
    </div>
  )
}
