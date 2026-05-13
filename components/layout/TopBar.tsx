"use client"

import { Menu } from "lucide-react"
import { useSidebarCtx } from "./SidebarContext"

interface TopBarProps {
  title: string
  action?: React.ReactNode
}

export default function TopBar({ title, action }: TopBarProps) {
  const ctx = useSidebarCtx()

  return (
    <div className="h-14 border-b border-[#2e2e2e] bg-[#111] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {ctx && (
          <button
            onClick={ctx.toggle}
            className="lg:hidden text-[#a8a8a8] hover:text-white p-1 -ml-1 rounded"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-sm font-semibold text-[#f5f5f5] tracking-wide">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
