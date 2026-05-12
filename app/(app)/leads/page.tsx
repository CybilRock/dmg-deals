import TopBar from "@/components/layout/TopBar"

const STATUSES = ["New", "Contacted", "Qualified", "Appointment", "Presented", "Won", "Lost"]

export default function LeadsPage() {
  return (
    <>
      <TopBar
        title="Leads"
        action={
          <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Lead
          </button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map((status) => (
            <div key={status} className="min-w-[200px] bg-white rounded-xl border border-[#e2e8f0] p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#0f172a]">{status}</p>
                <span className="text-xs text-[#94a3b8]">0</span>
              </div>
              <p className="text-xs text-[#94a3b8]">No leads</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
