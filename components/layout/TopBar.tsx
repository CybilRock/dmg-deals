interface TopBarProps {
  title: string
  action?: React.ReactNode
}

export default function TopBar({ title, action }: TopBarProps) {
  return (
    <div className="h-14 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-[#0f172a]">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
