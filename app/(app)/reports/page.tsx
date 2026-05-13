import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import { createPayoutRun } from "@/app/actions/payouts"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const supabase = createAdminClient()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: fridayRuns }, { data: contractorRuns }, { data: consultants }] = await Promise.all([
    supabase
      .from("payout_runs")
      .select("id, run_date, total_amount, notes, status")
      .eq("run_type", "friday_dhr")
      .order("run_date", { ascending: false }),
    supabase
      .from("payout_runs")
      .select("id, run_date, total_amount, notes, status")
      .eq("run_type", "seventh_contractor")
      .order("run_date", { ascending: false }),
    supabase
      .from("people")
      .select("id, name, role")
      .eq("active", true)
      .in("role", ["consultant", "booker", "both"])
      .order("name"),
  ])

  // Total consultant/booker payouts due (active deals not yet on a 7th run)
  const { data: unpaidDeals } = await supabase
    .from("deals")
    .select("consultant_payout, booker_payout, drip_remaining_payout")
    .eq("status", "active")

  const totalConsultantDue = (unpaidDeals ?? []).reduce((s, d) => s + (d.consultant_payout ?? 0), 0)
  const totalBookerDue     = (unpaidDeals ?? []).reduce((s, d) => s + (d.booker_payout ?? 0), 0)
  const totalDripDue       = (unpaidDeals ?? []).reduce((s, d) => s + (d.drip_remaining_payout ?? 0), 0)
  const total7thDue        = totalConsultantDue + totalBookerDue

  const inputClass = "w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
  const labelClass = "block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1"

  return (
    <>
      <TopBar title="Reports" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Friday DHR Payout Runs */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-[#f5f5f5]">Friday Payout Runs</h2>
            <p className="text-xs text-[#888] mt-0.5">Weekly DHR commission settlements — each payment reduces the DHR debt balance</p>
          </div>

          {/* History */}
          {!fridayRuns?.length ? (
            <p className="text-sm text-[#888]">No payout runs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e2e]">
                  <th className="text-left text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest">Date</th>
                  <th className="text-right text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest">Amount</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest pl-4">Notes</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {fridayRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 text-[#a8a8a8]">{formatDate(r.run_date)}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-400">{formatRand(r.total_amount)}</td>
                    <td className="py-2.5 pl-4 text-[#888] text-xs">{r.notes ?? "—"}</td>
                    <td className="py-2.5 pl-4">
                      <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Record new payment */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-[#c9a84c] hover:text-[#b8943e] list-none">
              + Record DHR Payment
            </summary>
            <form action={createPayoutRun} className="mt-4 space-y-3">
              <input type="hidden" name="run_type" value="friday_dhr" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date Received</label>
                  <input type="date" name="run_date" defaultValue={today} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Amount (ZAR)</label>
                  <input type="number" name="amount" step="0.01" className={inputClass} placeholder="e.g. 50000" required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes (optional)</label>
                <input type="text" name="notes" className={inputClass} placeholder="e.g. DHR EFT ref #12345" />
              </div>
              <button type="submit" className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Record Payment
              </button>
            </form>
          </details>
        </div>

        {/* 7th Contractor Runs */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f5f5f5]">7th Contractor Runs</h2>
              <p className="text-xs text-[#888] mt-0.5">Monthly consultant & booker payouts — run on the 7th of each month</p>
            </div>
            <div className="text-right shrink-0 ml-6">
              <p className="text-[10px] text-[#aaa] uppercase tracking-widest">Total Due</p>
              <p className="text-lg font-bold text-[#c9a84c]">{formatRand(total7thDue)}</p>
              <p className="text-[10px] text-[#888] mt-0.5">
                Cons {formatRand(totalConsultantDue)} · Booker {formatRand(totalBookerDue)}
                {totalDripDue > 0 && <span className="ml-1 text-amber-400">· Drip pending {formatRand(totalDripDue)}</span>}
              </p>
            </div>
          </div>

          {/* History */}
          {!contractorRuns?.length ? (
            <p className="text-sm text-[#888]">No contractor runs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e2e]">
                  <th className="text-left text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest">Date</th>
                  <th className="text-right text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest">Amount</th>
                  <th className="text-left text-[10px] font-bold text-[#aaa] pb-2 uppercase tracking-widest pl-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {contractorRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 text-[#a8a8a8]">{formatDate(r.run_date)}</td>
                    <td className="py-2.5 text-right font-semibold text-[#c9a84c]">{formatRand(r.total_amount)}</td>
                    <td className="py-2.5 pl-4 text-[#888] text-xs">{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Record new run */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-[#c9a84c] hover:text-[#b8943e] list-none">
              + Record 7th Run
            </summary>
            <form action={createPayoutRun} className="mt-4 space-y-3">
              <input type="hidden" name="run_type" value="seventh_contractor" />
              <div className="bg-[#111] border border-[#2e2e2e] rounded-lg p-3 mb-2">
                <p className="text-xs text-[#888]">
                  Active deal payouts: <span className="text-[#f5f5f5] font-semibold">{formatRand(total7thDue)}</span>
                  {totalDripDue > 0 && (
                    <span className="ml-3 text-amber-400">+ drip pending: {formatRand(totalDripDue)}</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Run Date</label>
                  <input type="date" name="run_date" defaultValue={today} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Total Amount Paid (ZAR)</label>
                  <input type="number" name="amount" step="0.01" defaultValue={total7thDue.toFixed(2)} className={inputClass} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes (optional)</label>
                <input type="text" name="notes" className={inputClass} placeholder="e.g. May 2026 contractor run" />
              </div>
              <button type="submit" className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Record Run
              </button>
            </form>
          </details>
        </div>

      </div>
    </>
  )
}
