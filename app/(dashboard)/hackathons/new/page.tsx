"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Trophy } from "lucide-react"
import Link from "next/link"

export default function NewHackathonPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    organizer: "",
    startDate: "",
    endDate: "",
    regDeadline: "",
    submissionDeadline: "",
    link: "",
    notificationsEnabled: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get user's first team
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (!teamMembers) throw new Error("No team found. Please create or join a team first.")

      // Create hackathon
      const { error: insertError } = await supabase.from("hackathons").insert({
        title: formData.title,
        organizer: formData.organizer || null,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        reg_deadline: formData.regDeadline || null,
        submission_deadline: formData.submissionDeadline || null,
        link: formData.link || null,
        notifications_enabled: formData.notificationsEnabled,
        team_id: teamMembers.team_id,
        created_by: user.id,
      })

      if (insertError) throw insertError

      router.push("/hackathons")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create hackathon")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathons
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Add Hackathon</CardTitle>
              <CardDescription>Track a new hackathon and never miss a deadline</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Hackathon Name *</Label>
                <Input
                  id="title"
                  placeholder="e.g., HackMIT 2025"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  placeholder="e.g., MIT"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link">Website URL</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://hackmit.org"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
            </div>

            {/* Event Dates */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Event Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Deadlines */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Important Deadlines</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="regDeadline">Registration Deadline</Label>
                  <Input
                    id="regDeadline"
                    type="datetime-local"
                    value={formData.regDeadline}
                    onChange={(e) => setFormData({ ...formData, regDeadline: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                  <Input
                    id="submissionDeadline"
                    type="datetime-local"
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium">
                  Enable Reminders
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get email alerts at 7 days, 3 days, 24 hours, and day of deadline
                </p>
              </div>
              <Switch
                id="notifications"
                checked={formData.notificationsEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, notificationsEnabled: checked })}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Add Hackathon"}
              </Button>
              <Link href="/hackathons">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
