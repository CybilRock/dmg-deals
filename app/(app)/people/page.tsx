import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ROLE_BADGE: Record<string, string> = {
  consultant: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  booker:     "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  both:       "bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20",
}

export default async function PeoplePage() {
  const supabase = createAdminClient()

  const [{ data: people }, { data: deals }] = await Promise.all([
    supabase.from("people").select("id, name, role, email, active, status").order("name"),
    supabase
      .from("deals")
      .select("consultant_id, booker_id, product, consultant_payout, booker_payout, status")
      .neq("status", "cancelled"),
  ])

  const withTotals = (people ?? []).map((p) => {
    const isBooker = p.role === "booker"
    const mine = (deals ?? []).filter((d) =>
      isBooker ? d.booker_id === p.id : d.consultant_id === p.id
    )
    const getPayout = (d: typeof mine[0]) =>
      isBooker ? (d.booker_payout ?? 0) : (d.consultant_payout ?? 0)
    const dvcEarned   = mine.filter((d) => d.product === "DVC").reduce((s, d) => s + getPayout(d), 0)
    const hcorpEarned = mine.filter((d) => d.product === "HolidayCorp").reduce((s, d) => s + getPayout(d), 0)
    return { ...p, dvcEarned, hcorpEarned, totalEarned: dvcEarned + hcorpEarned, dealCount: mine.length }
  })

  const consultants = withTotals.filter((p) => (p.role === "consultant" || p.role === "both") && p.status !== "pending")
  const bookers     = withTotals.filter((p) => p.role === "booker" && p.status !== "pending")
  const pending     = withTotals.filter((p) => p.status === "pending")

  return (
    <>
      <TopBar
        title="People"
        action={
          <Link
            href="/people/new"
            className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Person
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Consultants */}
        <section>
          <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Consultants</h2>
          {consultants.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
              <p className="text-sm text-[#aaa]">No consultants yet. <Link href="/people/new" className="text-[#c9a84c] hover:underline">Add one →</Link></p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e2e] bg-[#111]">
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Name</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">DVC</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">HCorp</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Total</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Deals</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {consultants.map((p) => (
                    <tr key={p.id} className="hover:bg-[#222] transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <Link href={`/people/${p.id}`} className="flex items-center gap-2">
                          <span className="font-semibold text-[#f5f5f5]">{p.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[p.role]}`}>
                            {p.role}
                          </span>
                          {!p.active && <span className="text-[9px] text-[#aaa]">inactive</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-[#a8a8a8]">{formatRand(p.dvcEarned)}</td>
                      <td className="px-4 py-3 text-right text-[#a8a8a8]">{formatRand(p.hcorpEarned)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#c9a84c]">{formatRand(p.totalEarned)}</td>
                      <td className="px-4 py-3 text-right text-[#888] text-xs">{p.dealCount}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/people/${p.id}/edit`} className="text-xs text-[#888] hover:text-[#c9a84c] transition-colors">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Bookers */}
        {bookers.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Bookers</h2>
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e2e] bg-[#111]">
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Name</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">DVC</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">HCorp</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {bookers.map((b) => (
                    <tr key={b.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#f5f5f5]">{b.name}</td>
                      <td className="px-4 py-3 text-right text-[#a8a8a8]">{formatRand(b.dvcEarned)}</td>
                      <td className="px-4 py-3 text-right text-[#a8a8a8]">{formatRand(b.hcorpEarned)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#c9a84c]">{formatRand(b.totalEarned)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/people/${b.id}/edit`} className="text-xs text-[#888] hover:text-[#c9a84c] transition-colors">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Pending (shouldn't usually show here, but handle gracefully) */}
        {pending.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Pending Approval</h2>
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#2e2e2e]">
                  {pending.map((p) => (
                    <tr key={p.id} className="hover:bg-[#222]">
                      <td className="px-4 py-3 font-medium text-[#a8a8a8]">{p.name}</td>
                      <td className="px-4 py-3 text-[#888] text-xs">{p.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </>
  )
}
