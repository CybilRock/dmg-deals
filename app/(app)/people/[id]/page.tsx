import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import TopBar from "@/components/layout/TopBar"
import Link from "next/link"
import { notFound } from "next/navigation"
import PortalInviteButton from "./PortalInviteButton"
import CommsLog from "./CommsLog"

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
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: person }, { data: deals }, { data: commsEntries }] = await Promise.all([
    supabase.from("people").select("*").eq("id", id).single(),
    supabase
      .from("deals")
      .select("id, client_name, product, deposit_type, deal_value, consultant_payout, drip_remaining_payout, source_brand, deal_date, status, self_generated")
      .eq("consultant_id", id)
      .order("deal_date", { ascending: false }),
    supabase
      .from("comms_log")
      .select("id, created_at, type, direction, summary, logged_by")
      .eq("person_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (!person) notFound()

  const activDeals      = (deals ?? []).filter((d) => d.status !== "cancelled")
  const dvcDeals        = activDeals.filter((d) => d.product === "DVC")
  const hcorpDeals      = activDeals.filter((d) => d.product === "HolidayCorp")
  const dvcEarned       = dvcDeals.reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
  const hcorpEarned     = hcorpDeals.reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
  const totalEarned     = dvcEarned + hcorpEarned
  const totalDripPending = activDeals.reduce((s, d) => s + (d.drip_remaining_payout ?? 0), 0)

  return (
    <>
      <TopBar
        title={person.name}
        action={
          <div className="flex items-center gap-3">
            <Link
              href={`/people/${id}/edit`}
              className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Edit Details
            </Link>
            <Link href="/people" className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">
              ← Back to People
            </Link>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Total earned banner */}
        <div className="bg-[#1a1a1a] border border-[#c9a84c]/20 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#aaa]">Total Earned to Date</p>
          <p className="text-4xl font-bold mt-2 tracking-tight text-[#c9a84c]">{formatRand(totalEarned)}</p>
          <p className="text-sm text-[#888] mt-1">
            {activDeals.length} deal{activDeals.length !== 1 ? "s" : ""} closed
          </p>
          {totalDripPending > 0 && (
            <div className="mt-3 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-400 font-semibold">
                + {formatRand(totalDripPending)} drip commission pending
              </p>
              <p className="text-[10px] text-amber-400/60 mt-0.5">Paid as No Deposit instalments arrive from DHR</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#2e2e2e] flex gap-8 text-sm">
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wide">DVC</p>
              <p className="font-semibold mt-0.5 text-[#f5f5f5]">{formatRand(dvcEarned)}</p>
              <p className="text-[#888] text-xs">{dvcDeals.length} deal{dvcDeals.length !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wide">HolidayCorp</p>
              <p className="font-semibold mt-0.5 text-[#f5f5f5]">{formatRand(hcorpEarned)}</p>
              <p className="text-[#888] text-xs">{hcorpDeals.length} deal{hcorpDeals.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Portal invite */}
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#f5f5f5]">Portal Access</p>
              <p className="text-xs text-[#a8a8a8] mt-0.5">
                {person.email
                  ? `Invite ${person.name.split(" ")[0]} to view their personal commission portal.`
                  : "Add an email address to enable portal access."}
              </p>
            </div>
            <PortalInviteButton personId={person.id} disabled={!person.email} />
          </div>
          {person.email && (
            <p className="text-xs text-[#888] mt-2">{person.email}</p>
          )}
        </section>

        {/* Deal history */}
        <section>
          <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Deal History</h2>
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
            {!deals?.length ? (
              <div className="p-5">
                <p className="text-sm text-[#888]">No deals linked to {person.name} yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e2e] bg-[#111]">
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Date</th>
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Client</th>
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Product</th>
                    <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Structure</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Deal Value</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Commission</th>
                    <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Drip Pending</th>
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
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">{formatRand(d.consultant_payout ?? 0)}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        {(d.drip_remaining_payout ?? 0) > 0
                          ? <span className="text-amber-400 font-semibold">{formatRand(d.drip_remaining_payout)}</span>
                          : <span className="text-[#333]">—</span>}
                      </td>
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
                    <td colSpan={5} className="px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-[#c9a84c]">{formatRand(totalEarned)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">
                      {totalDripPending > 0 ? formatRand(totalDripPending) : "—"}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </section>

        {/* Comms Log */}
        <CommsLog personId={id} initial={commsEntries ?? []} />

      </div>
    </>
  )
}
