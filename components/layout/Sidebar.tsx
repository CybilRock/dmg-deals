"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  UserSearch,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: FileText },
  { href: "/leads", label: "Leads", icon: UserSearch },
  { href: "/people", label: "People", icon: Users },
  { href: "/reports", label: "Reports", icon: TrendingUp },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-[#0f172a] flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-white font-semibold text-sm tracking-wide">DMG</p>
        <p className="text-white/40 text-xs mt-0.5">Deal Desk</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
