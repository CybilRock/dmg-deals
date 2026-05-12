import TopBar from "@/components/layout/TopBar"
import { createClient } from "@/lib/supabase/server"
import { formatRand, formatDate } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  paid:      "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  clawback:  "bg-orange-100 text-orange-700",
}

const DEPOSIT_LABEL: Record<string, string> = {
  "10pct":          "10%",
  "25to49pct":      "25–49%",
  "50pct":          "50%",
  "no_deposit":     "No Deposit",
  "self_generated": "Self-Gen",
  "upgrade":        "Upgrade",
  "hcorp_3yr":      "3-Year",
  "hcorp_5yr":      "5-Year",
  "hcorp_10yr":     "10-Year",
}

export default async function DealsPage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from("deals")
    .select("id, client_name, source_brand, product, points, deposit_type, deal_value, dmg_net, status, deal_date, self_generated")
    .order("created_at", { ascending: false })

  return (
    <>
      <TopBar
        title="Deals"
        action={
          <Link
            href="/deals/new"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Deal
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {!deals?.length ? (
            <div className="p-5">
              <p className="text-sm text-[#94a3b8]">
                No deals captured yet.{" "}
                <Link href="/deals/new" className="text-amber-500 hover:underline">Add the first deal →</Link>
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Client</th>
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Source</th>
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Product</th>
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Structure</th>
                  <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Deal Value</th>
                  <th className="text-right text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">DMG Net</th>
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Date</th>
                  <th className="text-left text-xs font-semibold text-[#94a3b8] px-4 py-3 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">
                      {d.client_name}
                      {d.self_generated && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded">SG</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{d.source_brand}</td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {d.product === "DVC" ? "DVC" : "HCorp"}
                      {d.product === "DVC" && d.points ? <span className="ml-1 text-[#94a3b8]">({d.points.toLocaleString()} pts)</span> : null}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{DEPOSIT_LABEL[d.deposit_type] ?? d.deposit_type}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{formatRand(d.deal_value)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRand(d.dmg_net)}</td>
                    <td className="px-4 py-3 text-[#94a3b8]">{formatDate(d.deal_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[d.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
