"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type Lead = { id: string; name: string; email: string }

export default function LeadToast() {
  const [toasts, setToasts] = useState<(Lead & { key: number })[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("calculator-leads")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: "source_channel=eq.calculator",
        },
        (payload) => {
          const lead = payload.new as Lead
          const key = Date.now()
          setToasts((prev) => [...prev, { ...lead, key }])
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.key !== key))
          }, 6000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.key}
          className="pointer-events-auto bg-[#1a1a1a] border border-[#c9a84c]/40 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[260px] max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div className="w-2 h-2 rounded-full bg-[#c9a84c] shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#f5f5f5] truncate">New HB Lead</p>
            <p className="text-[11px] text-[#aaa] truncate">{t.name || t.email}</p>
          </div>
          <Link
            href="/leads"
            className="text-[11px] font-bold text-[#c9a84c] hover:underline shrink-0"
          >
            View →
          </Link>
        </div>
      ))}
    </div>
  )
}
