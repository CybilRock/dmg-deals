import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  paid:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  clawback:  "bg-orange-500/10 text-orange-400 border border-orange-500/20",
}

const PACKAGE_LABEL: Record<string, string> = {
  "10pct":          "10% Dep",
  "25to49pct":      "25–49% Dep",
  "50pct":          "50% Dep",
  "no_deposit":     "No Deposit",
  "self_generated": "Self-Gen",
  "upgrade":        "Upgrade",
  "hcorp_3yr":      "3-Year",
  "hcorp_5yr":      "5-Year",
  "hcorp_10yr":     "10-Year",
}

const SOURCE_SHORT: Record<string, string> = {
  "Doctor Travel":    "DR",
  "Advocate Travel":  "ADV",
  "Holiday Brokers":  "HB",
  "Referral":         "REF",
  "Walk-in":          "WI",
  "Online":           "ONL",
}

export default async function DealsPage() {
  const supabase = createAdminClient()

  const [{ data: deals }, { data: consultants }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, client_name, source_brand, product, points, deposit_type, deal_value, dmg_net, status, deal_date, self_generated, consultant_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("people")
      .select("id, name")
      .in("role", ["consultant", "both"]),
  ])

  const consultantMap = Object.fromEntries((consultants ?? []).map((c) => [c.id, c.name]))

  return (
    <>
      <TopBar
        title="Deals"
        action={
          <Link
            href="/deals/new"
            className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + New Deal
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
          {!deals?.length ? (
            <div className="p-6">
              <p className="text-sm text-[#aaa]">
                No deals captured yet.{" "}
                <Link href="/deals/new" className="text-[#c9a84c] hover:underline">Add the first deal →</Link>
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e2e] bg-[#111]">
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Client</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Agent</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Src</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Product</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Package</th>
                  <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Deal Value</th>
                  <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">DMG Net</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Date</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#f5f5f5]">
                      {d.client_name}
                      {d.self_generated && (
                        <span className="ml-2 text-[9px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 font-bold px-1.5 py-0.5 rounded">SG</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#a8a8a8]">
                      {d.consultant_id ? (consultantMap[d.consultant_id] ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#a8a8a8] text-xs font-semibold tracking-wide">
                      {SOURCE_SHORT[d.source_brand] ?? d.source_brand}
                    </td>
                    <td className="px-4 py-3 text-[#a8a8a8]">
                      {d.product === "DVC" ? "DVC" : "HCorp"}
                    </td>
                    <td className="px-4 py-3 text-[#a8a8a8]">
                      {d.product === "DVC" && d.points
                        ? `${d.points.toLocaleString()} pts`
                        : (PACKAGE_LABEL[d.deposit_type] ?? d.deposit_type)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#f5f5f5]">{formatRand(d.deal_value)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">{formatRand(d.dmg_net)}</td>
                    <td className="px-4 py-3 text-[#888]">{formatDate(d.deal_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_BADGE[d.status] ?? "bg-[#222] text-[#a8a8a8]"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/deals/${d.id}/edit`}
                        className="text-xs text-[#888] hover:text-[#c9a84c] transition-colors"
                      >
                        Edit
                      </Link>
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
