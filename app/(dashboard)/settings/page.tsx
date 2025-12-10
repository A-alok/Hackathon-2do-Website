"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Save } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notificationsEmail: true,
    notificationsWhatsapp: false,
  })

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile) {
        const p = profile as Profile
        setFormData({
          name: p.name || "",
          email: p.email || user.email || "",
          phone: p.phone || "",
          notificationsEmail: p.notifications_email,
          notificationsWhatsapp: p.notifications_whatsapp,
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
        }))
      }
      setIsFetching(false)
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        name: formData.name || null,
        email: formData.email,
        phone: formData.phone || null,
        notifications_email: formData.notificationsEmail,
        notifications_whatsapp: formData.notificationsWhatsapp,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number (for WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Required for WhatsApp notifications</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>How you want to be reminded</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotif" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive deadline reminders and task updates via email
                </p>
              </div>
              <Switch
                id="emailNotif"
                checked={formData.notificationsEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, notificationsEmail: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="whatsappNotif" className="text-sm font-medium">
                  WhatsApp Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get instant alerts via WhatsApp (requires phone number)
                </p>
              </div>
              <Switch
                id="whatsappNotif"
                checked={formData.notificationsWhatsapp}
                onCheckedChange={(checked) => setFormData({ ...formData, notificationsWhatsapp: checked })}
                disabled={!formData.phone}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        {success && <p className="text-sm text-success mb-4">Settings saved successfully!</p>}

        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
