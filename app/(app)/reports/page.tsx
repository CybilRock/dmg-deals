import TopBar from "@/components/layout/TopBar"

export default function ReportsPage() {
  return (
    <>
      <TopBar title="Reports" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#f5f5f5] mb-1">Friday Payout Runs</h2>
            <p className="text-xs text-[#555] mb-4">Weekly DHR commission settlements</p>
            <p className="text-sm text-[#555]">No payout runs yet.</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#f5f5f5] mb-1">7th Contractor Runs</h2>
            <p className="text-xs text-[#555] mb-4">Monthly consultant & booker payouts</p>
            <p className="text-sm text-[#555]">No contractor runs yet.</p>
          </div>
        </div>
      </div>
    </>
  )
}
