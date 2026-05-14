import TopBar from "@/components/layout/TopBar"
import DealForm from "@/components/deals/DealForm"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function NewDealPage() {
  const supabase = createAdminClient()

  const [{ data: consultants }, { data: activeBooker }] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, is_owner")
      .in("role", ["consultant", "both"])
      .eq("active", true)
      .order("name"),
    supabase
      .from("people")
      .select("id")
      .in("role", ["booker", "both"])
      .eq("active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ])

  let bookerCumulativeDealValue = 0
  if (activeBooker) {
    const { data: bookerDeals } = await supabase
      .from("deals")
      .select("deal_value")
      .eq("booker_id", activeBooker.id)
      .neq("status", "cancelled")
    bookerCumulativeDealValue = bookerDeals?.reduce((s, d) => s + (d.deal_value ?? 0), 0) ?? 0
  }

  return (
    <>
      <TopBar title="New Deal" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <DealForm
            consultants={consultants ?? []}
            bookerCumulativeDealValue={bookerCumulativeDealValue}
          />
        </div>
      </div>
    </>
  )
}
