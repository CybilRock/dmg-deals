"use client"

import TopBar from "@/components/layout/TopBar"
import { addPerson } from "@/app/actions/people"
import { useTransition, useState } from "react"
import Link from "next/link"

export default function NewPersonPage() {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: "", role: "consultant", email: "", phone: "" })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const inputClass = "mt-1 w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
  const labelClass = "text-xs text-[#64748b] font-medium"

  return (
    <>
      <TopBar
        title="Add Person"
        action={<Link href="/people" className="text-xs text-[#64748b] hover:text-[#0f172a]">← Cancel</Link>}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md bg-white rounded-xl border border-[#e2e8f0] p-6 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Sarah Johnson"
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
            >
              <option value="consultant">Consultant</option>
              <option value="booker">Booker</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Email (optional)</label>
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
              placeholder="e.g. sarah@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="e.g. 082 000 0000"
            />
          </div>
          <button
            type="button"
            disabled={!form.name || pending}
            onClick={() =>
              startTransition(() =>
                addPerson({ name: form.name, role: form.role, email: form.email, phone: form.phone })
              )
            }
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Add Person"}
          </button>
        </div>
      </div>
    </>
  )
}
