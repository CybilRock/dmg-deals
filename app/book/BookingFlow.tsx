"use client"

import { useState, useTransition } from "react"
import { ChevronLeft, Check } from "lucide-react"
import { getBookedSlots, createBooking } from "@/app/actions/book"

// 30-min slots 09:00–16:30 (last appointment ends 17:00)
const SLOT_TIMES = Array.from({ length: 16 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const min  = (i % 2) * 30
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
})

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getWorkWeeks(baseDate: Date, count = 5): Date[][] {
  const weeks: Date[][] = []
  const start = new Date(baseDate)
  const dow = start.getDay() === 0 ? 6 : start.getDay() - 1
  start.setDate(start.getDate() - dow)
  start.setHours(0, 0, 0, 0)

  for (let w = 0; w < count; w++) {
    const week: Date[] = []
    for (let d = 0; d < 5; d++) {
      week.push(new Date(start))
      start.setDate(start.getDate() + 1)
    }
    start.setDate(start.getDate() + 2)
    weeks.push(week)
  }
  return weeks
}

type Step = 1 | 2 | 3 | "done"

export default function BookingFlow() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)

  const weeks = getWorkWeeks(today, 5)

  const [step, setStep]               = useState<Step>(1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots]   = useState<string[]>([])
  const [name, setName]               = useState("")
  const [phone, setPhone]             = useState("")
  const [email, setEmail]             = useState("")
  const [interest, setInterest]       = useState<"Dream Vacation Club" | "HolidayCorp" | "Both">("Dream Vacation Club")
  const [error, setError]             = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function handleDateSelect(d: Date) {
    if (d < today || d > maxDate) return
    setSelectedDate(d)
    setSelectedTime(null)
    setBookedSlots([])
    setStep(2)
    startTransition(async () => {
      const slots = await getBookedSlots(toDateStr(d))
      setBookedSlots(slots)
    })
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time)
    setStep(3)
  }

  function isSlotBooked(time: string) {
    if (!selectedDate) return false
    const candidateMs = new Date(`${toDateStr(selectedDate)}T${time}:00+02:00`).getTime()
    return bookedSlots.some((s) => new Date(s).getTime() === candidateMs)
  }

  function isSlotPast(time: string) {
    if (!selectedDate || !sameDay(selectedDate, new Date())) return false
    const [h, m] = time.split(":").map(Number)
    const slotDate = new Date(selectedDate)
    slotDate.setHours(h, m, 0, 0)
    return slotDate <= new Date()
  }

  function handleSubmit() {
    if (!selectedDate || !selectedTime) return
    setError(null)
    if (!name.trim())  { setError("Name is required."); return }
    if (!phone.trim()) { setError("Phone is required."); return }

    const appointmentAt = `${toDateStr(selectedDate)}T${selectedTime}:00+02:00`

    startTransition(async () => {
      const result = await createBooking({ name, phone, email, interest, appointment_at: appointmentAt })
      if ("error" in result) { setError(result.error); return }
      setStep("done")
    })
  }

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-2">You&apos;re booked!</h2>
        <p className="text-[#888] text-sm mb-1">
          {selectedDate?.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <p className="text-[#c9a84c] font-semibold mb-6">{selectedTime}</p>
        <div className="bg-[#111] rounded-xl p-4 text-sm text-left space-y-2">
          <p className="text-[#888]">✦ A consultant will be in touch to confirm</p>
          <p className="text-[#888]">✦ The consultation takes approximately 60–90 minutes</p>
          <p className="text-[#888]">✦ No commitment required at this stage</p>
        </div>
      </div>
    )
  }

  const stepNum = step as number

  return (
    <div className="space-y-4">

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 transition-colors ${
              stepNum >= s
                ? "bg-[#c9a84c] border-[#c9a84c] text-black"
                : "border-[#2e2e2e] text-[#555]"
            }`}>{s}</div>
            {s < 3 && <div className={`flex-1 h-px transition-colors ${stepNum > s ? "bg-[#c9a84c]" : "bg-[#2e2e2e]"}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Date ── */}
      {step === 1 && (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] mb-5">Select a date</h2>

          <div className="grid grid-cols-5 gap-1 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-[#555] py-1">{d}</div>
            ))}
          </div>

          {weeks.map((week, wi) => {
            const hasAvailable = week.some((d) => d >= today && d <= maxDate)
            if (!hasAvailable && wi > 0) return null
            return (
              <div key={wi} className="grid grid-cols-5 gap-1 mb-1">
                {week.map((d) => {
                  const isPast    = d < today
                  const isTooFar  = d > maxDate
                  const disabled  = isPast || isTooFar
                  const isSelected = selectedDate ? sameDay(d, selectedDate) : false
                  const isToday   = sameDay(d, new Date())
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => !disabled && handleDateSelect(d)}
                      disabled={disabled}
                      className={`aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#c9a84c] text-black font-bold"
                          : disabled
                          ? "text-[#2a2a2a] cursor-not-allowed"
                          : isToday
                          ? "border border-[#c9a84c]/50 text-[#c9a84c] hover:bg-[#c9a84c]/10"
                          : "text-[#a8a8a8] hover:bg-[#252525] hover:text-[#f5f5f5]"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            )
          })}

          <p className="text-[11px] text-[#444] mt-4">Available Mon–Fri · up to 30 days ahead</p>
        </div>
      )}

      {/* ── Step 2: Time ── */}
      {step === 2 && (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setStep(1)}
              className="text-[#555] hover:text-[#888] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-[#f5f5f5]">
                {selectedDate?.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <p className="text-[11px] text-[#555]">Select a time slot</p>
            </div>
          </div>

          {isPending ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#555]">Checking availability…</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {SLOT_TIMES.map((time) => {
                const unavailable = isSlotBooked(time) || isSlotPast(time)
                return (
                  <button
                    key={time}
                    onClick={() => !unavailable && handleTimeSelect(time)}
                    disabled={unavailable}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      unavailable
                        ? "bg-[#111] text-[#2a2a2a] cursor-not-allowed"
                        : "bg-[#222] border border-[#2e2e2e] text-[#a8a8a8] hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] hover:border-[#c9a84c]/40"
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Details ── */}
      {step === 3 && (
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="text-[#555] hover:text-[#888] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-[#f5f5f5]">Your details</h2>
              <p className="text-[11px] text-[#555]">
                {selectedDate?.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })} · {selectedTime}
              </p>
            </div>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name *"
            className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#444] focus:outline-none focus:border-[#c9a84c] transition-colors"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number *"
            type="tel"
            className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#444] focus:outline-none focus:border-[#c9a84c] transition-colors"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address (optional)"
            type="email"
            className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#444] focus:outline-none focus:border-[#c9a84c] transition-colors"
          />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-2">I&apos;m interested in</p>
            <div className="flex gap-2">
              {(["Dream Vacation Club", "HolidayCorp", "Both"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setInterest(opt)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    interest === opt
                      ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10"
                      : "border-[#2e2e2e] text-[#555] hover:border-[#3e3e3e] hover:text-[#888]"
                  }`}
                >
                  {opt === "Dream Vacation Club" ? "DVC" : opt}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !phone.trim()}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-black text-sm font-bold py-3 rounded-lg transition-colors"
          >
            {isPending ? "Confirming…" : "Confirm booking"}
          </button>

          <p className="text-[11px] text-[#444] text-center">
            No commitment required. A consultant will confirm your appointment.
          </p>
        </div>
      )}
    </div>
  )
}
