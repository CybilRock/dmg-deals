import TopBar from "@/components/layout/TopBar"

export default function ReportsPage() {
  return (
    <>
      <TopBar title="Reports" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">Friday Payout Runs</h2>
            <p className="text-xs text-[#94a3b8] mb-4">Weekly DHR commission settlements</p>
            <p className="text-sm text-[#94a3b8]">No payout runs yet.</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">7th-of-Month Contractor Runs</h2>
            <p className="text-xs text-[#94a3b8] mb-4">Monthly consultant & booker payouts</p>
            <p className="text-sm text-[#94a3b8]">No contractor runs yet.</p>
          </div>
        </div>
      </div>
    </>
  )
}
