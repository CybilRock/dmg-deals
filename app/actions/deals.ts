"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

const CONTRACTOR_BASE = 15.5

function debbieRate(totalTurnover: number): number {
  if (totalTurnover > 1_000_000) return 0.02
  if (totalTurnover > 500_000)   return 0.015
  return 0.01
}

async function repriceBookerDeals(
  supabase: ReturnType<typeof createAdminClient>,
  bookerId: string,
) {
  const { data: deals } = await supabase
    .from("deals")
    .select("id, points, deposit_type, deal_value, net_excl_vat, consultant_payout, drip_remaining_payout")
    .eq("booker_id", bookerId)
    .eq("product", "DVC")
    .neq("status", "cancelled")

  if (!deals?.length) return

  const totalTurnover = deals
    .filter((d) => d.deposit_type !== "no_deposit")
    .reduce((s, d) => s + (d.deal_value ?? 0), 0)

  const flatRate = debbieRate(totalTurnover)

  await Promise.all(deals.map((deal) => {
    const isDrip  = deal.deposit_type === "no_deposit"
    const rate    = isDrip ? 0.01 : flatRate
    const payout  = (deal.points ?? 0) * CONTRACTOR_BASE * rate
    const dmgNet  = (deal.net_excl_vat ?? 0) - (deal.consultant_payout ?? 0) - (deal.drip_remaining_payout ?? 0) - payout
    return supabase.from("deals").update({
      booker_rate:   rate,
      booker_payout: Math.round(payout * 100) / 100,
      dmg_net:       Math.round(dmgNet * 100) / 100,
    }).eq("id", deal.id)
  }))
}

type DealPayload = {
  clientName:          string
  clientPhone:         string
  clientEmail:         string
  sourceBrand:         string
  product:             "DVC" | "HolidayCorp"
  points:              number
  depositType:         string
  selfGenerated:       boolean
  consultantId:        string
  dealValue:           number
  dmgRate:             number
  commission:          number
  retentionRate:       number
  retention:           number
  dmgReceives:         number
  vat:                 number
  netExclVat:          number
  contractorBase:      number
  consultantRate:      number
  consultantPayout:    number
  dripRemainingPayout: number
  bookerRate:          number
  bookerPayout:        number
  dmgNet:              number
  notes:               string
  hcorpPaymentType?:   string
  hcorpAmountPaid?:    number
}

export async function saveDeal(data: DealPayload): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { data: activebooker } = await supabase
    .from("people")
    .select("id")
    .in("role", ["booker", "both"])
    .eq("active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle()

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      client_name:           data.clientName,
      client_phone:          data.clientPhone,
      client_email:          data.clientEmail,
      source_brand:          data.sourceBrand,
      product:               data.product,
      points:                data.points,
      deposit_type:          data.depositType,
      self_generated:        data.selfGenerated,
      consultant_id:         data.consultantId || null,
      booker_id:             activebooker?.id ?? null,
      deal_value:            data.dealValue,
      dmg_rate:              data.dmgRate,
      commission:            data.commission,
      retention_rate:        data.retentionRate,
      retention:             data.retention,
      dmg_receives:          data.dmgReceives,
      vat:                   data.vat,
      net_excl_vat:          data.netExclVat,
      contractor_base:       data.contractorBase,
      consultant_rate:       data.consultantRate,
      consultant_payout:     data.consultantPayout,
      drip_remaining_payout: data.dripRemainingPayout,
      booker_rate:           data.bookerRate,
      booker_payout:         data.bookerPayout,
      dmg_net:               data.dmgNet,
      notes:                 data.notes,
      drip_deal:             data.depositType === "no_deposit",
      hcorp_payment_type:    data.hcorpPaymentType ?? null,
      hcorp_amount_paid:     data.hcorpAmountPaid  ?? 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (data.product === "DVC" && data.retention > 0) {
    await supabase.from("dhr_debt_ledger").insert({
      deal_id:    deal.id,
      entry_type: "retention_added",
      amount:     data.retention,
      notes:      `Deal: ${data.clientName} — ${data.points} pts`,
    })
  }

  if (activebooker?.id) await repriceBookerDeals(supabase, activebooker.id)

  redirect("/deals")
}

export async function updateDeal(id: string, data: DealPayload): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { data: activeBooker } = await supabase
    .from("people")
    .select("id")
    .in("role", ["booker", "both"])
    .eq("active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from("deals")
    .update({
      client_name:           data.clientName,
      client_phone:          data.clientPhone,
      client_email:          data.clientEmail,
      source_brand:          data.sourceBrand,
      product:               data.product,
      points:                data.points,
      deposit_type:          data.depositType,
      self_generated:        data.selfGenerated,
      consultant_id:         data.consultantId || null,
      deal_value:            data.dealValue,
      dmg_rate:              data.dmgRate,
      commission:            data.commission,
      retention_rate:        data.retentionRate,
      retention:             data.retention,
      dmg_receives:          data.dmgReceives,
      vat:                   data.vat,
      net_excl_vat:          data.netExclVat,
      contractor_base:       data.contractorBase,
      consultant_rate:       data.consultantRate,
      consultant_payout:     data.consultantPayout,
      drip_remaining_payout: data.dripRemainingPayout,
      booker_rate:           data.bookerRate,
      booker_payout:         data.bookerPayout,
      dmg_net:               data.dmgNet,
      notes:                 data.notes,
      drip_deal:             data.depositType === "no_deposit",
      hcorp_payment_type:    data.hcorpPaymentType ?? null,
      hcorp_amount_paid:     data.hcorpAmountPaid  ?? 0,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  if (activeBooker?.id) await repriceBookerDeals(supabase, activeBooker.id)

  redirect("/deals")
}
