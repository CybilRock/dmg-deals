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
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="bg-[#111] border-b border-[#2e2e2e] px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[#c9a84c] font-light text-sm tracking-[0.15em] leading-none">dream</p>
            <p className="text-white text-[10px] font-bold tracking-[0.25em] uppercase leading-none mt-0.5">Merchant Group</p>
          </div>
          <span className="text-[#2e2e2e]">·</span>
          <span className="text-xs text-[#aaa] tracking-widest uppercase">My Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {person?.name && (
            <span className="hidden sm:block text-sm text-[#a8a8a8]">{person.name}</span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5] border border-[#2e2e2e] rounded-lg px-3 py-1.5 transition-colors"
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
