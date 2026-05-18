"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  UserSearch,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/actions/auth"
import { useSidebarCtx } from "./SidebarContext"
import { createClient } from "@/lib/supabase/client"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals",     label: "Deals",     icon: FileText },
  { href: "/leads",     label: "Leads",     icon: UserSearch },
  { href: "/people",    label: "People",    icon: Users },
  { href: "/reports",   label: "Reports",   icon: TrendingUp },
]

function useNewCalculatorLeadCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const refresh = () =>
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("source_channel", "calculator")
        .eq("status", "new")
        .then(({ count: c }) => setCount(c ?? 0))

    refresh()

    const channel = supabase
      .channel("sidebar-lead-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return count
}

export default function Sidebar() {
  const path = usePathname()
  const ctx  = useSidebarCtx()
  const newLeadCount = useNewCalculatorLeadCount()

  return (
    <aside className="w-56 h-full bg-[#111] flex flex-col shrink-0 border-r border-[#2e2e2e]">
      {/* DMG wordmark */}
      <div className="px-5 py-5 border-b border-[#2e2e2e]">
        <p className="text-[#c9a84c] font-light text-sm tracking-[0.15em] leading-none">dream</p>
        <p className="text-white text-[11px] font-bold tracking-[0.25em] uppercase mt-0.5">Merchant Group</p>
        <p className="text-[#aaa] text-[9px] tracking-[0.3em] uppercase mt-2">Deal Desk</p>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          const badge = href === "/leads" && newLeadCount > 0 ? newLeadCount : null
          return (
            <Link
              key={href}
              href={href}
              onClick={() => ctx?.close()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                active
                  ? "bg-[rgba(201,168,76,0.12)] text-[#c9a84c]"
                  : "text-[#a8a8a8] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
              {badge !== null && (
                <span className="ml-auto text-[9px] font-bold bg-[#c9a84c] text-black px-1.5 py-0.5 rounded-full leading-none">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-2.5 py-4 border-t border-[#2e2e2e] space-y-1">
        <p className="text-[#aaa] text-[9px] tracking-widest uppercase px-3 mb-2">DMG Internal</p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[#a8a8a8] hover:bg-white/5 hover:text-red-400 transition-colors"
          >
            <LogOut size={15} strokeWidth={1.5} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
