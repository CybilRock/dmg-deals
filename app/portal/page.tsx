import { createClient } from "@/lib/supabase/server"
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

  // Resolve this user's people record via their email
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("email", user.email)
    .maybeSingle()

  // If no people record exists, they are admin — send to dashboard
  if (!person) redirect("/dashboard")

  const isBooker = person.role === "booker"

  // Fetch deals linked to this person
  const dealsQuery = isBooker
    ? supabase
        .from("deals")
        .select("id, client_name, product, deposit_type, deal_value, consultant_payout, booker_payout, source_brand, deal_date, status, self_generated")
        .eq("booker_id", person.id)
        .order("deal_date", { ascending: false })
    : supabase
        .from("deals")
        .select("id, client_name, product, deposit_type, deal_value, consultant_payout, booker_payout, source_brand, deal_date, status, self_generated")
        .eq("consultant_id", person.id)
        .order("deal_date", { ascending: false })

  const { data: deals } = await dealsQuery

  const getPayout = (d: { consultant_payout: number | null; booker_payout: number | null }) =>
    isBooker ? (d.booker_payout ?? 0) : (d.consultant_payout ?? 0)

  const activeDeals   = (deals ?? []).filter((d) => d.status !== "cancelled")
  const dvcDeals      = activeDeals.filter((d) => d.product === "DVC")
  const hcorpDeals    = activeDeals.filter((d) => d.product === "HolidayCorp")
  const dvcEarned     = dvcDeals.reduce((s, d) => s + getPayout(d), 0)
  const hcorpEarned   = hcorpDeals.reduce((s, d) => s + getPayout(d), 0)
  const totalEarned   = dvcEarned + hcorpEarned

  const roleLabel = person.role === "booker" ? "Pre-Sales" : person.role === "both" ? "Consultant & Pre-Sales" : "Consultant"

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Welcome back, {person.name.split(" ")[0]}</h1>
        <p className="text-sm text-[#64748b] mt-0.5">{roleLabel} · Dream Merchant Group</p>
      </div>

      {/* Total earned banner */}
      <div className="bg-[#0f172a] rounded-2xl p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8]">Total Earned to Date</p>
        <p className="text-5xl font-bold mt-2 tracking-tight">{formatRand(totalEarned)}</p>
        <p className="text-sm text-[#94a3b8] mt-1">
          {activeDeals.length} deal{activeDeals.length !== 1 ? "s" : ""} closed
        </p>
        {totalEarned > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1e293b] flex gap-8 text-sm">
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wide">Dream Vacation Club</p>
              <p className="font-semibold mt-0.5 text-lg">{formatRand(dvcEarned)}</p>
              <p className="text-[#64748b] text-xs">{dvcDeals.length} deal{dvcDeals.length !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wide">HolidayCorp</p>
              <p className="font-semibold mt-0.5 text-lg">{formatRand(hcorpEarned)}</p>
              <p className="text-[#64748b] text-xs">{hcorpDeals.length} deal{hcorpDeals.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Deal history */}
      <section>
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">Deal History</h2>
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {!deals?.length ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#94a3b8]">No deals on record yet.</p>
              <p className="text-xs text-[#94a3b8] mt-1">Your deals will appear here once they're entered by the office.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Date</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Client</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Product</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Structure</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Deal Value</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Your Commission</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {deals.map((d) => (
                    <tr key={d.id} className={`hover:bg-[#fafafa] ${d.status === "cancelled" ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 text-[#94a3b8]">{formatDate(d.deal_date)}</td>
                      <td className="px-4 py-3 font-medium text-[#0f172a]">
                        {d.client_name}
                        {d.self_generated && (
                          <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded">SG</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#64748b]">{d.product === "DVC" ? "DVC" : "HCorp"}</td>
                      <td className="px-4 py-3 text-[#64748b]">{DEPOSIT_LABEL[d.deposit_type] ?? d.deposit_type}</td>
                      <td className="px-4 py-3 text-right text-[#0f172a]">{formatRand(d.deal_value)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRand(getPayout(d))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === "paid"      ? "bg-blue-100 text-blue-700"     :
                          d.status === "cancelled" ? "bg-red-100 text-red-700"       :
                          d.status === "clawback"  ? "bg-orange-100 text-orange-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#e2e8f0] bg-[#f8fafc]">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Total Earned</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{formatRand(totalEarned)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
