"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths } from "date-fns"

export function CalendarNavigation({ currentDate }: { currentDate: Date }) {
  const router = useRouter()

  const navigateToMonth = (date: Date) => {
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    router.push(`/calendar?month=${month}&year=${year}`)
  }

  const handlePrevious = () => {
    navigateToMonth(subMonths(currentDate, 1))
  }

  const handleNext = () => {
    navigateToMonth(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    navigateToMonth(new Date())
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleToday}>
        Today
      </Button>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
