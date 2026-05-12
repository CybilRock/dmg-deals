"use client"

interface TopBarProps {
  title: string
  action?: React.ReactNode
}

export default function TopBar({ title, action }: TopBarProps) {
  return (
    <div className="h-14 border-b border-[#2e2e2e] bg-[#111] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-[#f5f5f5] tracking-wide">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
