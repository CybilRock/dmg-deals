"use client"

import { applyAsPartner } from "@/app/actions/partners"
import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"

const inputClass = "mt-1.5 w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
const labelClass = "text-[10px] font-bold text-[#aaa] uppercase tracking-widest"

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
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] font-light text-xl tracking-[0.2em]">dream</p>
          <p className="text-white text-sm font-bold tracking-[0.35em] uppercase">Merchant Group</p>
          <p className="text-[#aaa] text-[10px] tracking-[0.4em] uppercase mt-3">Partner Application</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-8 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Your full name" />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="you@email.com" />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="082 000 0000" />
          </div>
          <div>
            <label className={labelClass}>I want to join as a</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass}>
              <option value="consultant">Consultant</option>
              <option value="booker">Booker (Pre-Sales)</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!form.name || !form.email || pending}
            onClick={submit}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {pending ? "Submitting…" : "Apply to Join"}
          </button>
        </div>

        <p className="text-center text-[10px] text-[#aaa] tracking-widest uppercase mt-6">
          We review all applications within 1–2 business days
        </p>
      </div>
    </div>
  )
}
