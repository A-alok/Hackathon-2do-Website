import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Crown, UserPlus } from "lucide-react"
import Link from "next/link"
import { CopyInviteButton } from "@/components/team/copy-invite-button"
import type { Team, Profile } from "@/lib/types"

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get user's team memberships
  const { data: teamMembers } = await supabase.from("team_members").select("team_id, role").eq("user_id", user.id)

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Team</h1>
          <p className="text-muted-foreground">Collaborate with your hackathon teammates</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No team yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create a team to start collaborating on hackathons together
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/team/create">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create a Team
                </Button>
              </Link>
              <Link href="/team/join">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <UserPlus className="w-4 h-4" />
                  Join with Invite Code
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const teamId = teamMembers[0].team_id
  const userRole = teamMembers[0].role

  // Fetch team details
  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single()

  // Fetch all team members with profiles
  const { data: members } = await supabase
    .from("team_members")
    .select("*, profile:user_id(id, name, email)")
    .eq("team_id", teamId)

  const teamData = team as Team
  const membersList = (members || []) as {
    id: string
    user_id: string
    role: string
    joined_at: string
    profile: Profile
  }[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{teamData.name}</h1>
          <p className="text-muted-foreground">
            {membersList.length} member{membersList.length !== 1 ? "s" : ""}
          </p>
        </div>
        {userRole === "admin" && (
          <Link href="/team/settings">
            <Button variant="outline">Team Settings</Button>
          </Link>
        )}
      </div>

      {/* Invite Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Invite teammates</h3>
              <p className="text-sm text-muted-foreground">Share this code with your team to let them join</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-background rounded-lg font-mono text-sm border border-border">
                {teamData.invite_code}
              </code>
              <CopyInviteButton inviteCode={teamData.invite_code} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>People in your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {membersList.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.profile?.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {member.profile?.name || member.profile?.email || "Unknown"}
                      </p>
                      {member.user_id === user.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" && (
                    <Badge className="gap-1 bg-chart-4/20 text-chart-4">
                      <Crown className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
