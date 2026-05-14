import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const DEPOSIT_LABEL: Record<string, string> = {
  "10pct":          "10% Deposit",
  "25to49pct":      "25–49% Deposit",
  "50pct":          "50% Deposit",
  "no_deposit":     "No Deposit",
  "self_generated": "Self-Generated",
  "upgrade":        "Upgrade",
  "hcorp_3yr":      "HCorp 3-Year",
  "hcorp_5yr":      "HCorp 5-Year",
  "hcorp_10yr":     "HCorp 10-Year",
}


export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: person } = await admin
    .from("people")
    .select("*")
    .eq("email", user.email)
    .maybeSingle()

  if (!person) redirect("/dashboard")

  const isBooker    = person.role === "booker"
  const payoutCol   = isBooker ? "booker_payout" : "consultant_payout"
  const filterCol   = isBooker ? "booker_id"     : "consultant_id"

  const { data: deals } = await admin
    .from("deals")
    .select(`id, client_name, product, deposit_type, deal_value, ${payoutCol}, source_brand, deal_date, status, self_generated`)
    .eq(filterCol, person.id)
    .order("deal_date", { ascending: false })

  const getPayout = (d: Record<string, unknown>) => (d[payoutCol] as number | null) ?? 0

  const activeDeals   = (deals ?? []).filter((d) => d.status !== "cancelled")
  const dvcDeals      = activeDeals.filter((d) => d.product === "DVC")
  const hcorpDeals    = activeDeals.filter((d) => d.product === "HolidayCorp")
  const dvcEarned     = dvcDeals.reduce((s, d) => s + getPayout(d), 0)
  const hcorpEarned   = hcorpDeals.reduce((s, d) => s + getPayout(d), 0)
  const totalEarned   = dvcEarned + hcorpEarned

  const roleLabel     = person.role === "booker" ? "Pre-Sales" : person.role === "both" ? "Consultant & Pre-Sales" : "Consultant"

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">

      {/* Welcome */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#f5f5f5]">
          Welcome back, {person.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-[#a8a8a8] mt-0.5">{roleLabel} · Dream Merchant Group</p>
      </div>

      {/* Section nav */}
      <div className="flex gap-4 text-xs font-semibold border-b border-[#2e2e2e] pb-3">
        <a href="#earnings" className="text-[#c9a84c] hover:text-[#b8943e]">Earnings</a>
        <a href="#deals"    className="text-[#a8a8a8] hover:text-[#f5f5f5]">Deals</a>
      </div>

      {/* ─── EARNINGS ─── */}
      <section id="earnings">
        <div className="bg-[#1a1a1a] border border-[#c9a84c]/20 rounded-2xl p-5 md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#aaa]">Total Earned to Date</p>
          <p className="text-4xl md:text-5xl font-bold mt-2 tracking-tight text-[#c9a84c]">{formatRand(totalEarned)}</p>
          <p className="text-sm text-[#888] mt-1">
            {activeDeals.length} deal{activeDeals.length !== 1 ? "s" : ""} closed
          </p>
          {totalEarned > 0 && (
            <div className="mt-4 pt-4 border-t border-[#2e2e2e] grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#888] text-xs uppercase tracking-wide">Dream Vacation Club</p>
                <p className="font-semibold mt-0.5 text-base md:text-lg text-[#f5f5f5]">{formatRand(dvcEarned)}</p>
                <p className="text-[#888] text-xs">{dvcDeals.length} deal{dvcDeals.length !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-[#888] text-xs uppercase tracking-wide">HolidayCorp</p>
                <p className="font-semibold mt-0.5 text-base md:text-lg text-[#f5f5f5]">{formatRand(hcorpEarned)}</p>
                <p className="text-[#888] text-xs">{hcorpDeals.length} deal{hcorpDeals.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── DEALS ─── */}
      <section id="deals">
        <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Deal History</h2>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          {!deals?.length ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#888]">No deals on record yet.</p>
              <p className="text-xs text-[#888] mt-1">Your deals will appear here once they&apos;re entered by the office.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] bg-[#111]">
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Date</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Client</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Product</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Structure</th>
                      <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Deal Value</th>
                      <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Your Commission</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e2e2e]">
                    {deals.map((d) => (
                      <tr key={d.id} className={`hover:bg-[#111] ${d.status === "cancelled" ? "opacity-40" : ""}`}>
                        <td className="px-4 py-3 text-[#888]">{formatDate(d.deal_date)}</td>
                        <td className="px-4 py-3 font-medium text-[#f5f5f5]">
                          {d.client_name}
                          {d.self_generated && (
                            <span className="ml-2 text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] font-bold px-1.5 py-0.5 rounded">SG</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#a8a8a8]">{d.product === "DVC" ? "DVC" : "HCorp"}</td>
                        <td className="px-4 py-3 text-[#a8a8a8]">{DEPOSIT_LABEL[d.deposit_type] ?? d.deposit_type}</td>
                        <td className="px-4 py-3 text-right text-[#f5f5f5]">{formatRand(d.deal_value)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">{formatRand(getPayout(d))}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            d.status === "paid"      ? "bg-blue-500/10 text-blue-400"     :
                            d.status === "cancelled" ? "bg-red-500/10 text-red-400"       :
                            d.status === "clawback"  ? "bg-orange-500/10 text-orange-400" :
                            "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#2e2e2e] bg-[#111]">
                      <td colSpan={5} className="px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Total Earned</td>
                      <td className="px-4 py-3 text-right font-bold text-[#c9a84c]">{formatRand(totalEarned)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[#2e2e2e]">
                {deals.map((d) => (
                  <div key={d.id} className={`p-4 ${d.status === "cancelled" ? "opacity-40" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[#f5f5f5] text-sm">
                          {d.client_name}
                          {d.self_generated && (
                            <span className="ml-2 text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] font-bold px-1.5 py-0.5 rounded">SG</span>
                          )}
                        </p>
                        <p className="text-xs text-[#888] mt-0.5">{formatDate(d.deal_date)}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                        d.status === "paid"      ? "bg-blue-500/10 text-blue-400"     :
                        d.status === "cancelled" ? "bg-red-500/10 text-red-400"       :
                        d.status === "clawback"  ? "bg-orange-500/10 text-orange-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-[#a8a8a8]">
                        {d.product === "DVC" ? "DVC" : "HCorp"} · {DEPOSIT_LABEL[d.deposit_type] ?? d.deposit_type}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#888]">{formatRand(d.deal_value)}</p>
                        <p className="font-semibold text-sm text-emerald-400">{formatRand(getPayout(d))}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-[#111] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Total Earned</span>
                  <span className="font-bold text-[#c9a84c]">{formatRand(totalEarned)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  )
}
