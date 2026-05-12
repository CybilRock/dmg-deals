import TopBar from "@/components/layout/TopBar"
import DealForm from "@/components/deals/DealForm"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function NewDealPage() {
  const supabase = await createClient()

  const { data: consultants } = await supabase
    .from("people")
    .select("id, name")
    .in("role", ["consultant", "both"])
    .eq("active", true)
    .order("name")

  return (
    <>
      <TopBar title="New Deal" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <DealForm consultants={consultants ?? []} />
        </div>
      </div>
    </>
  )
}
