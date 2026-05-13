"use client"

import TopBar from "@/components/layout/TopBar"
import { addPerson } from "@/app/actions/people"
import { useTransition, useState } from "react"
import Link from "next/link"

const inputClass = "mt-1.5 w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
const labelClass = "text-[10px] font-bold text-[#aaa] uppercase tracking-widest"

export default function NewPersonPage() {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: "", role: "consultant", email: "", phone: "" })
  const [error, setError] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <TopBar
        title="Add Person"
        action={<Link href="/people" className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">← Cancel</Link>}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass}>
              <option value="consultant">Consultant</option>
              <option value="booker">Booker</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Email (optional)</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="e.g. sarah@email.com" />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="e.g. 082 000 0000" />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="button"
            disabled={!form.name || pending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await addPerson({ name: form.name, role: form.role, email: form.email, phone: form.phone })
                if (result?.error) setError(result.error)
              })
            }}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Add Person"}
          </button>
        </div>
      </div>
    </>
  )
}
