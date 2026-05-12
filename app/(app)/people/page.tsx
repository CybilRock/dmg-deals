import TopBar from "@/components/layout/TopBar"
import { createClient } from "@/lib/supabase/server"
import { formatRand } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ROLE_BADGE: Record<string, string> = {
  consultant: "bg-blue-100 text-blue-700",
  booker:     "bg-purple-100 text-purple-700",
  both:       "bg-amber-100 text-amber-700",
}

export default async function PeoplePage() {
  const supabase = await createClient()

  const [{ data: people }, { data: deals }] = await Promise.all([
    supabase.from("people").select("id, name, role, email, active").order("name"),
    supabase
      .from("deals")
      .select("consultant_id, product, consultant_payout, status")
      .neq("status", "cancelled"),
  ])

  const withTotals = (people ?? []).map((p) => {
    const mine = (deals ?? []).filter((d) => d.consultant_id === p.id)
    const dvcEarned    = mine.filter((d) => d.product === "DVC").reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
    const hcorpEarned  = mine.filter((d) => d.product === "HolidayCorp").reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
    const totalEarned  = dvcEarned + hcorpEarned
    const dealCount    = mine.length
    return { ...p, dvcEarned, hcorpEarned, totalEarned, dealCount }
  })

  const consultants = withTotals.filter((p) => p.role === "consultant" || p.role === "both")
  const bookers     = withTotals.filter((p) => p.role === "booker")

  return (
    <>
      <TopBar
        title="People"
        action={
          <Link
            href="/people/new"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Person
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Consultants */}
        <section>
          <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">Consultants</h2>
          {consultants.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <p className="text-sm text-[#94a3b8]">No consultants added yet. <Link href="/people/new" className="text-amber-500 hover:underline">Add one →</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {consultants.map((p) => (
                <Link
                  key={p.id}
                  href={`/people/${p.id}`}
                  className="bg-white rounded-xl border border-[#e2e8f0] p-5 hover:border-amber-300 hover:shadow-sm transition-all block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0f172a]">{p.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[p.role]}`}>
                          {p.role}
                        </span>
                        {!p.active && <span className="text-[10px] text-[#94a3b8]">inactive</span>}
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-0.5">{p.dealCount} deal{p.dealCount !== 1 ? "s" : ""} closed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0f172a]">{formatRand(p.totalEarned)}</p>
                      <p className="text-xs text-[#94a3b8]">total earned</p>
                    </div>
                  </div>
                  {p.totalEarned > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex gap-4 text-xs text-[#64748b]">
                      <span>DVC <strong className="text-[#0f172a]">{formatRand(p.dvcEarned)}</strong></span>
                      <span>HCorp <strong className="text-[#0f172a]">{formatRand(p.hcorpEarned)}</strong></span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bookers */}
        {bookers.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">Bookers</h2>
            <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Name</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">DVC Paid</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">HCorp Paid</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {bookers.map((b) => (
                    <tr key={b.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{b.name}</td>
                      <td className="px-4 py-3 text-right text-[#64748b]">{formatRand(b.dvcEarned)}</td>
                      <td className="px-4 py-3 text-right text-[#64748b]">{formatRand(b.hcorpEarned)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">{formatRand(b.totalEarned)}</td>
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
