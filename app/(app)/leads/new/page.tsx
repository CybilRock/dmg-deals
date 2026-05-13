import LeadForm from "@/components/leads/LeadForm"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function NewLeadPage() {
  const supabase = createAdminClient()

  const { data: consultants } = await supabase
    .from("people")
    .select("id, name")
    .in("role", ["consultant", "both"])
    .eq("status", "approved")
    .order("name")

  return <LeadForm consultants={consultants ?? []} />
}
