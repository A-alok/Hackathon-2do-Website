"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default function CreateTeamPage() {
  const router = useRouter()
  const [name, setName] = useState("")
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

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as admin member
      const { error: memberError } = await supabase.from("team_members").upsert({
        team_id: team.id,
        user_id: user.id,
        role: "admin",
      }, { onConflict: 'team_id,user_id' })

      if (memberError) throw memberError

      router.push("/team")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team")
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
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Create a Team</CardTitle>
              <CardDescription>Start collaborating with your hackathon teammates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dream Team, Hackathon Heroes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">You can change this later in team settings</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
