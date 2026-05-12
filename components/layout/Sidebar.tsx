"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  UserSearch,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals",     label: "Deals",     icon: FileText },
  { href: "/leads",     label: "Leads",     icon: UserSearch },
  { href: "/people",    label: "People",    icon: Users },
  { href: "/reports",   label: "Reports",   icon: TrendingUp },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-[#111] flex flex-col shrink-0 border-r border-[#2e2e2e]">
      {/* DMG wordmark */}
      <div className="px-5 py-5 border-b border-[#2e2e2e]">
        <p className="text-[#c9a84c] font-light text-sm tracking-[0.15em] leading-none">dream</p>
        <p className="text-white text-[11px] font-bold tracking-[0.25em] uppercase mt-0.5">Merchant Group</p>
        <p className="text-[#555] text-[9px] tracking-[0.3em] uppercase mt-2">Deal Desk</p>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                active
                  ? "bg-[rgba(201,168,76,0.12)] text-[#c9a84c]"
                  : "text-[#a8a8a8] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2.5 py-4 border-t border-[#2e2e2e]">
        <p className="text-[#555] text-[9px] tracking-widest uppercase px-3">DMG Internal</p>
      </div>
    </aside>
  )
}
