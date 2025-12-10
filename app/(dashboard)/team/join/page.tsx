"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"

export default function JoinTeamPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Find team by invite code
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("invite_code", inviteCode.trim())
        .single()

      if (teamError || !team) {
        throw new Error("Invalid invite code. Please check and try again.")
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        throw new Error("You're already a member of this team")
      }

      // Join team
      const { error: joinError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "member",
      })

      if (joinError) throw joinError

      router.push("/team")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join team")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/team"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Join a Team</CardTitle>
              <CardDescription>Enter the invite code shared by your teammate</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">Ask your team admin for the invite code</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Joining..." : "Join Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
