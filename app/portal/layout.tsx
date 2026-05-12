import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "@/app/actions/auth"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: person } = await supabase
    .from("people")
    .select("name")
    .eq("email", user.email)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Portal top bar */}
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-[#0f172a] rounded-lg">
            <span className="text-amber-400 font-bold text-sm">D</span>
          </div>
          <span className="text-sm font-semibold text-[#0f172a]">DMG Deal Desk</span>
          <span className="text-[#e2e8f0]">·</span>
          <span className="text-sm text-[#64748b]">My Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {person?.name && (
            <span className="text-sm text-[#64748b]">{person.name}</span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0] rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
