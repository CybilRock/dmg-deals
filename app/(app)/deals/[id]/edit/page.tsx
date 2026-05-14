import TopBar from "@/components/layout/TopBar"
import DealForm, { DealFormInitialValues } from "@/components/deals/DealForm"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: deal }, { data: consultants }, { data: activeBooker }] = await Promise.all([
    supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single(),
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

  if (!deal) notFound()

  let bookerCumulativeDealValue = 0
  if (activeBooker) {
    const { data: bookerDeals } = await supabase
      .from("deals")
      .select("deal_value")
      .eq("booker_id", activeBooker.id)
      .eq("product", "DVC")
      .neq("status", "cancelled")
      .neq("id", id)
    bookerCumulativeDealValue = bookerDeals?.reduce((s, d) => s + (d.deal_value ?? 0), 0) ?? 0
  }

  const initialValues: DealFormInitialValues = {
    clientName:       deal.client_name,
    clientPhone:      deal.client_phone  ?? "",
    clientEmail:      deal.client_email  ?? "",
    sourceBrand:      deal.source_brand,
    product:          deal.product,
    consultantId:     deal.consultant_id ?? "",
    points:           deal.points?.toString() ?? "",
    depositType:      deal.product === "DVC" ? deal.deposit_type : "",
    selfGenerated:    deal.self_generated ?? false,
    hcorpTerm:        deal.product === "HolidayCorp" ? deal.deposit_type : "",
    hcorpPaymentType: (deal.hcorp_payment_type as "full" | "deposit" | "full_finance") ?? "full",
    hcorpAmountPaid:  deal.hcorp_amount_paid?.toString() ?? "",
    notes:            deal.notes ?? "",
  }

  return (
    <>
      <TopBar
        title="Edit Deal"
        action={
          <Link href="/deals" className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">
            ← Back to Deals
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <DealForm
            consultants={consultants ?? []}
            initialValues={initialValues}
            dealId={id}
            bookerCumulativeDealValue={bookerCumulativeDealValue}
          />
        </div>
      </div>
    </>
  )
}
