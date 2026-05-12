"use client"

import { applyAsPartner } from "@/app/actions/partners"
import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"

const inputClass =
  "mt-1 w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
const labelClass = "text-xs text-[#64748b] font-medium"

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "consultant" })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const router = useRouter()

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    setError("")
    startTransition(async () => {
      try {
        await applyAsPartner(form)
        router.push("/register/success")
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-[#0f172a] rounded-xl mx-auto mb-4">
            <span className="text-amber-400 font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Partner Application</h1>
          <p className="text-sm text-[#64748b] mt-1">Dream Merchant Group</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="082 000 0000"
            />
          </div>
          <div>
            <label className={labelClass}>I want to join as a</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
            >
              <option value="consultant">Consultant</option>
              <option value="booker">Booker (Pre-Sales)</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!form.name || !form.email || pending}
            onClick={submit}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {pending ? "Submitting…" : "Apply to Join"}
          </button>
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-4">
          We review all applications within 1–2 business days.
        </p>
      </div>
    </div>
  )
}
