import { createClient } from "@/lib/supabase/server"
import { formatRand, formatDate } from "@/lib/utils"
import TopBar from "@/components/layout/TopBar"
import Link from "next/link"
import { notFound } from "next/navigation"
import { sendPortalInvite } from "@/app/actions/auth"

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

export default async function ConsultantPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { invited?: string }
}) {
  const supabase = await createClient()

  const [{ data: person }, { data: deals }] = await Promise.all([
    supabase.from("people").select("*").eq("id", params.id).single(),
    supabase
      .from("deals")
      .select("id, client_name, product, deposit_type, deal_value, consultant_payout, source_brand, deal_date, status, self_generated")
      .eq("consultant_id", params.id)
      .order("deal_date", { ascending: false }),
  ])

  if (!person) notFound()

  const activDeals   = (deals ?? []).filter((d) => d.status !== "cancelled")
  const dvcDeals     = activDeals.filter((d) => d.product === "DVC")
  const hcorpDeals   = activDeals.filter((d) => d.product === "HolidayCorp")
  const dvcEarned    = dvcDeals.reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
  const hcorpEarned  = hcorpDeals.reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
  const totalEarned  = dvcEarned + hcorpEarned

  const sendInviteAction = sendPortalInvite.bind(null, person.id)

  return (
    <>
      <TopBar
        title={person.name}
        action={
          <Link href="/people" className="text-xs text-[#64748b] hover:text-[#0f172a]">
            ← Back to People
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Total earned banner */}
        <div className="bg-[#0f172a] rounded-2xl p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8]">Total Earned to Date</p>
          <p className="text-4xl font-bold mt-2 tracking-tight">{formatRand(totalEarned)}</p>
          <p className="text-sm text-[#94a3b8] mt-1">
            {activDeals.length} deal{activDeals.length !== 1 ? "s" : ""} closed
          </p>
          <div className="mt-4 pt-4 border-t border-[#1e293b] flex gap-8 text-sm">
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wide">DVC</p>
              <p className="font-semibold mt-0.5">{formatRand(dvcEarned)}</p>
              <p className="text-[#64748b] text-xs">{dvcDeals.length} deal{dvcDeals.length !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wide">HolidayCorp</p>
              <p className="font-semibold mt-0.5">{formatRand(hcorpEarned)}</p>
              <p className="text-[#64748b] text-xs">{hcorpDeals.length} deal{hcorpDeals.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Portal invite */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">Portal Access</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                {person.email
                  ? `Invite ${person.name.split(" ")[0]} to view their personal commission portal.`
                  : "Add an email address to enable portal access."}
              </p>
            </div>
            {searchParams.invited === "true" ? (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                Invite sent ✓
              </span>
            ) : (
              <form action={sendInviteAction}>
                <button
                  type="submit"
                  disabled={!person.email}
                  className="text-xs font-semibold bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send Portal Invite
                </button>
              </form>
            )}
          </div>
          {person.email && (
            <p className="text-xs text-[#94a3b8] mt-2">{person.email}</p>
          )}
        </section>

        {/* Deal history */}
        <section>
          <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">Deal History</h2>
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            {!deals?.length ? (
              <div className="p-5">
                <p className="text-sm text-[#94a3b8]">No deals linked to {person.name} yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Date</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Client</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Product</th>
                    <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Structure</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Deal Value</th>
                    <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Commission</th>
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
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRand(d.consultant_payout ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === "paid"      ? "bg-blue-100 text-blue-700"   :
                          d.status === "cancelled" ? "bg-red-100 text-red-700"     :
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
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{formatRand(totalEarned)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </section>

      </div>
    </>
  )
}
