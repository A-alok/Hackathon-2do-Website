"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Trophy, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Hackathon } from "@/lib/types"

export default function EditHackathonPage() {
  const router = useRouter()
  const params = useParams()
  const hackathonId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
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

  useEffect(() => {
    async function fetchHackathon() {
      const supabase = createClient()
      const { data, error } = await supabase.from("hackathons").select("*").eq("id", hackathonId).single()

      if (error || !data) {
        setError("Hackathon not found")
        setIsFetching(false)
        return
      }

      const hackathon = data as Hackathon
      setFormData({
        title: hackathon.title,
        organizer: hackathon.organizer || "",
        startDate: hackathon.start_date ? new Date(hackathon.start_date).toISOString().slice(0, 16) : "",
        endDate: hackathon.end_date ? new Date(hackathon.end_date).toISOString().slice(0, 16) : "",
        regDeadline: hackathon.reg_deadline ? new Date(hackathon.reg_deadline).toISOString().slice(0, 16) : "",
        submissionDeadline: hackathon.submission_deadline
          ? new Date(hackathon.submission_deadline).toISOString().slice(0, 16)
          : "",
        link: hackathon.link || "",
        notificationsEnabled: hackathon.notifications_enabled,
      })
      setIsFetching(false)
    }

    fetchHackathon()
  }, [hackathonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("hackathons")
        .update({
          title: formData.title,
          organizer: formData.organizer || null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          reg_deadline: formData.regDeadline || null,
          submission_deadline: formData.submissionDeadline || null,
          link: formData.link || null,
          notifications_enabled: formData.notificationsEnabled,
        })
        .eq("id", hackathonId)

      if (updateError) throw updateError

      router.push("/hackathons")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update hackathon")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from("hackathons").delete().eq("id", hackathonId)

      if (deleteError) throw deleteError

      router.push("/hackathons")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete hackathon")
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      </div>
    )
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Edit Hackathon</CardTitle>
                <CardDescription>Update hackathon details</CardDescription>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Hackathon?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the hackathon and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link">Website URL</Label>
                <Input
                  id="link"
                  type="url"
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
                <p className="text-xs text-muted-foreground mt-0.5">Get email alerts before deadlines</p>
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
                {isLoading ? "Saving..." : "Save Changes"}
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
