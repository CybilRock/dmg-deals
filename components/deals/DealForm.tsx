"use client"

import { useState, useMemo, useTransition } from "react"
import { formatRand } from "@/lib/utils"
import { saveDeal, updateDeal } from "@/app/actions/deals"

const SOURCE_BRANDS = [
  "Doctor Travel",
  "Advocate Travel",
  "Holiday Brokers",
  "Online",
  "Referral",
  "Walk-in",
]

const DEPOSIT_TYPES = [
  { value: "10pct",          label: "10% Deposit",              dmgRate: 0.45, consultantRate: 0.25 },
  { value: "25to49pct",      label: "25–49% Deposit",           dmgRate: 0.48, consultantRate: 0.26 },
  { value: "50pct",          label: "50% Deposit",              dmgRate: null, consultantRate: 0.30 },
  { value: "no_deposit",     label: "No Deposit (Full Finance)", dmgRate: 0.40, consultantRate: 0.10 },
  { value: "self_generated", label: "Self-Generated",           dmgRate: null, consultantRate: null },
  { value: "upgrade",        label: "Upgrade",                  dmgRate: 0.30, consultantRate: 0.30 },
]

const HCORP_TERMS = [
  { value: "hcorp_3yr",  label: "3-Year  — R25,000",  dealValue: 25000, agentComm: 2500,  debbiePreSales: 650  },
  { value: "hcorp_5yr",  label: "5-Year  — R54,000",  dealValue: 54000, agentComm: 5282,  debbiePreSales: 1100 },
  { value: "hcorp_10yr", label: "10-Year — R75,000",  dealValue: 75000, agentComm: 7300,  debbiePreSales: 1500 },
]

const POINT_PRICE    = 20
const CONTRACTOR_BASE = 15.5
// No-Deposit DVC: consultant earns 10% upfront + 5% drip as DMG receives monthly instalments
const DVC_DRIP_CONSULTANT_RATE = 0.05

function calcRetentionRate(commission: number) {
  return commission > 150000 ? 0.15 : 0.10
}

function calcDebbieRate(cumulativeValue: number): number {
  if (cumulativeValue > 1_000_000) return 0.02
  if (cumulativeValue > 500_000)   return 0.015
  return 0.01
}

type Consultant = { id: string; name: string; is_owner: boolean }

export type DealFormInitialValues = {
  clientName:       string
  clientPhone:      string
  clientEmail:      string
  sourceBrand:      string
  product:          string
  consultantId:     string
  points:           string
  depositType:      string
  selfGenerated:    boolean
  hcorpTerm:        string
  hcorpPaymentType: "full" | "deposit" | "full_finance"
  hcorpAmountPaid:  string
  notes:            string
}

export default function DealForm({
  consultants,
  initialValues,
  dealId,
  bookerCumulativeDealValue = 0,
}: {
  consultants: Consultant[]
  initialValues?: Partial<DealFormInitialValues>
  dealId?: string
  bookerCumulativeDealValue?: number
}) {
  const [pending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<DealFormInitialValues>({
    clientName:       initialValues?.clientName       ?? "",
    clientPhone:      initialValues?.clientPhone      ?? "",
    clientEmail:      initialValues?.clientEmail      ?? "",
    sourceBrand:      initialValues?.sourceBrand      ?? "",
    product:          initialValues?.product          ?? "DVC",
    consultantId:     initialValues?.consultantId     ?? "",
    points:           initialValues?.points           ?? "",
    depositType:      initialValues?.depositType      ?? "",
    selfGenerated:    initialValues?.selfGenerated    ?? false,
    hcorpTerm:        initialValues?.hcorpTerm        ?? "",
    hcorpPaymentType: initialValues?.hcorpPaymentType ?? "full",
    hcorpAmountPaid:  initialValues?.hcorpAmountPaid  ?? "",
    notes:            initialValues?.notes            ?? "",
  })

  const set = (k: keyof DealFormInitialValues, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const selectedConsultant = useMemo(
    () => consultants.find((c) => c.id === form.consultantId),
    [consultants, form.consultantId],
  )
  const isOwnerConsultant = selectedConsultant?.is_owner ?? false

  // DVC calculation
  const calcDVC = useMemo(() => {
    if (form.product !== "DVC") return null
    const points = parseFloat(form.points) || 0
    if (!points || !form.depositType) return null

    const dep = DEPOSIT_TYPES.find((d) => d.value === form.depositType)
    if (!dep || dep.dmgRate === null || dep.consultantRate === null) return null

    const isDrip = form.depositType === "no_deposit"

    let dmgRate        = dep.dmgRate
    let baseConsRate   = dep.consultantRate
    if (form.selfGenerated) {
      dmgRate      += 0.03
      baseConsRate += 0.03
    }

    // Owner closes deal: all contractor base stays with DMG
    const effectiveConsRate  = isOwnerConsultant ? 0 : baseConsRate
    const consultantDripRate = (!isOwnerConsultant && isDrip) ? DVC_DRIP_CONSULTANT_RATE : 0

    const dealValue     = points * POINT_PRICE
    const commission    = dealValue * dmgRate
    const retentionRate = calcRetentionRate(commission)
    const retention     = commission * retentionRate
    const dmgReceives   = commission - retention
    const vat           = dmgReceives * (15 / 115)
    const netExclVat    = dmgReceives - vat

    const contractorBase      = points * CONTRACTOR_BASE
    const consultantPayout    = contractorBase * effectiveConsRate      // paid now
    const consultantDripPayout = contractorBase * consultantDripRate    // paid as drip arrives
    const bookerRate          = calcDebbieRate(bookerCumulativeDealValue + dealValue)
    const bookerPayout        = contractorBase * bookerRate
    const dmgNet              = netExclVat - consultantPayout - consultantDripPayout - bookerPayout

    return {
      type: "dvc" as const,
      dealValue, commission, dmgRate, retentionRate, retention,
      dmgReceives, vat, netExclVat, contractorBase,
      consultantRate: effectiveConsRate,
      consultantPayout,
      consultantDripRate,
      consultantDripPayout,
      bookerRate, bookerPayout,
      dmgNet,
      isDrip,
      isOwner: isOwnerConsultant,
    }
  }, [form.product, form.points, form.depositType, form.selfGenerated, isOwnerConsultant, bookerCumulativeDealValue])

  // HolidayCorp calculation
  const calcHCorp = useMemo(() => {
    if (form.product !== "HolidayCorp") return null
    const term = HCORP_TERMS.find((t) => t.value === form.hcorpTerm)
    if (!term) return null

    const paymentType = form.hcorpPaymentType
    const amountPaid =
      paymentType === "full"         ? term.dealValue :
      paymentType === "full_finance" ? 0 :
      Math.max(0, parseFloat(form.hcorpAmountPaid) || 0)

    const pctPaid = term.dealValue > 0 ? amountPaid / term.dealValue : 0

    // Full finance: nobody gets paid until first instalments arrive. Owner: no payout.
    const consultantUpfront = (isOwnerConsultant || paymentType === "full_finance") ? 0 : term.agentComm * pctPaid
    const debbieUpfront     = paymentType === "full_finance" ? 0 : term.debbiePreSales

    const dmgNet = amountPaid - consultantUpfront - debbieUpfront

    return {
      type: "hcorp" as const,
      dealValue:         term.dealValue,
      agentComm:         term.agentComm,
      debbiePreSales:    term.debbiePreSales,
      amountPaid,
      pctPaid,
      consultantUpfront,
      debbieUpfront,
      dmgNet,
      paymentType,
      isOwner:           isOwnerConsultant,
    }
  }, [form.product, form.hcorpTerm, form.hcorpPaymentType, form.hcorpAmountPaid, isOwnerConsultant])

  const calc = form.product === "HolidayCorp" ? calcHCorp : calcDVC

  const row = (label: string, value: string, highlight = false, muted = false) => (
    <div key={label} className={`flex justify-between py-2 text-sm border-b border-[#2e2e2e] last:border-0 ${highlight ? "font-semibold" : ""}`}>
      <span className={muted ? "text-[#444]" : "text-[#aaa]"}>{label}</span>
      <span className={highlight ? "text-[#c9a84c]" : muted ? "text-[#aaa] italic" : "text-[#f5f5f5]"}>{value}</span>
    </div>
  )

  const inputClass = "mt-1.5 w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
  const labelClass = "text-[10px] font-bold text-[#aaa] uppercase tracking-widest"

  function handleSave() {
    if (!calc) return
    setSaveError(null)
    startTransition(async () => {
      if (calc.type === "dvc") {
        const payload = {
          clientName:           form.clientName,
          clientPhone:          form.clientPhone,
          clientEmail:          form.clientEmail,
          sourceBrand:          form.sourceBrand,
          product:              "DVC" as const,
          points:               parseFloat(form.points),
          depositType:          form.depositType,
          selfGenerated:        form.selfGenerated,
          consultantId:         form.consultantId,
          dealValue:            calc.dealValue,
          dmgRate:              calc.dmgRate,
          commission:           calc.commission,
          retentionRate:        calc.retentionRate,
          retention:            calc.retention,
          dmgReceives:          calc.dmgReceives,
          vat:                  calc.vat,
          netExclVat:           calc.netExclVat,
          contractorBase:       calc.contractorBase,
          consultantRate:       calc.consultantRate,
          consultantPayout:     calc.consultantPayout,
          dripRemainingPayout:  calc.consultantDripPayout,
          bookerRate:           calc.bookerRate,
          bookerPayout:         calc.bookerPayout,
          dmgNet:               calc.dmgNet,
          notes:                form.notes,
        }
        const res = dealId ? await updateDeal(dealId, payload) : await saveDeal(payload)
        if (res?.error) setSaveError(res.error)
      } else {
        const payload = {
          clientName:           form.clientName,
          clientPhone:          form.clientPhone,
          clientEmail:          form.clientEmail,
          sourceBrand:          form.sourceBrand,
          product:              "HolidayCorp" as const,
          points:               0,
          depositType:          form.hcorpTerm,
          selfGenerated:        false,
          consultantId:         form.consultantId,
          dealValue:            calc.dealValue,
          dmgRate:              0,
          commission:           calc.dealValue,
          retentionRate:        0,
          retention:            0,
          dmgReceives:          calc.amountPaid,
          vat:                  0,
          netExclVat:           calc.amountPaid,
          contractorBase:       0,
          consultantRate:       0,
          consultantPayout:     calc.consultantUpfront,
          dripRemainingPayout:  0,
          bookerRate:           0,
          bookerPayout:         calc.debbieUpfront,
          dmgNet:               calc.dmgNet,
          hcorpPaymentType:     calc.paymentType,
          hcorpAmountPaid:      calc.amountPaid,
          notes:                form.notes,
        }
        const res = dealId ? await updateDeal(dealId, payload) : await saveDeal(payload)
        if (res?.error) setSaveError(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Client */}
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Full Name</label>
            <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} className={inputClass} placeholder="e.g. Dr. John Smith" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} className={inputClass} placeholder="e.g. 082 000 0000" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} className={inputClass} placeholder="e.g. john@practice.co.za" />
          </div>
        </div>
      </section>

      {/* Deal */}
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Deal</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Consultant</label>
            <select value={form.consultantId} onChange={(e) => set("consultantId", e.target.value)} className={inputClass}>
              <option value="">Select consultant...</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.is_owner ? " (Owner)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Source Brand</label>
            <select value={form.sourceBrand} onChange={(e) => set("sourceBrand", e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              {SOURCE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Product</label>
            <select
              value={form.product}
              onChange={(e) => {
                set("product", e.target.value)
                set("depositType", "")
                set("hcorpTerm", "")
                set("points", "")
              }}
              className={inputClass}
            >
              <option value="DVC">Dream Vacation Club</option>
              <option value="HolidayCorp">HolidayCorp</option>
            </select>
          </div>

          {/* DVC fields */}
          {form.product === "DVC" && (
            <>
              <div>
                <label className={labelClass}>Points</label>
                <input type="number" value={form.points} onChange={(e) => set("points", e.target.value)} className={inputClass} placeholder="e.g. 5000" />
              </div>
              <div>
                <label className={labelClass}>Deposit Type</label>
                <select value={form.depositType} onChange={(e) => set("depositType", e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {DEPOSIT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex items-center">
                <label className="flex items-center gap-2 text-sm text-[#a8a8a8] cursor-pointer">
                  <input type="checkbox" checked={form.selfGenerated} onChange={(e) => set("selfGenerated", e.target.checked)} className="rounded border-[#2e2e2e] accent-[#c9a84c]" />
                  Self-Generated (+3% bonus)
                </label>
              </div>
            </>
          )}

          {/* HolidayCorp fields */}
          {form.product === "HolidayCorp" && (
            <>
              <div className="col-span-2">
                <label className={labelClass}>Membership Term</label>
                <select value={form.hcorpTerm} onChange={(e) => set("hcorpTerm", e.target.value)} className={inputClass}>
                  <option value="">Select term...</option>
                  {HCORP_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.hcorpTerm && (
                <>
                  <div className="col-span-2">
                    <label className={labelClass}>Payment Received</label>
                    <select
                      value={form.hcorpPaymentType}
                      onChange={(e) => {
                        set("hcorpPaymentType", e.target.value)
                        set("hcorpAmountPaid", "")
                      }}
                      className={inputClass}
                    >
                      <option value="full">Full Payment (100%)</option>
                      <option value="deposit">Deposit Received</option>
                      <option value="full_finance">Full Finance (debit order — nothing upfront)</option>
                    </select>
                  </div>
                  {form.hcorpPaymentType === "deposit" && (() => {
                    const term = HCORP_TERMS.find((t) => t.value === form.hcorpTerm)
                    const suggested30 = term ? Math.round(term.dealValue * 0.30) : null
                    return (
                      <div className="col-span-2">
                        <label className={labelClass}>
                          Amount Received (ZAR)
                          {suggested30 && <span className="ml-2 text-[#aaa] normal-case">— 30% = {formatRand(suggested30)}</span>}
                        </label>
                        <input
                          type="number"
                          value={form.hcorpAmountPaid}
                          onChange={(e) => set("hcorpAmountPaid", e.target.value)}
                          className={inputClass}
                          placeholder={suggested30 ? `e.g. ${suggested30}` : "Enter amount"}
                        />
                      </div>
                    )
                  })()}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Live Calculation — DVC */}
      {calc?.type === "dvc" && (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] mb-3">Live Calculation</h2>
          {calc.isDrip && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              No Deposit deal — DMG receives 20% upfront, 20% via monthly instalments from DHR.
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">DMG Income from DHR</p>
              {row("Deal Value", formatRand(calc.dealValue))}
              {row(`Commission (${(calc.dmgRate * 100).toFixed(0)}%)`, formatRand(calc.commission))}
              {row(`Retention (${(calc.retentionRate * 100).toFixed(0)}%)`, `− ${formatRand(calc.retention)}`)}
              {row("DMG Receives", formatRand(calc.dmgReceives))}
              {row("VAT (15/115)", `− ${formatRand(calc.vat)}`)}
              {row("Net excl. VAT", formatRand(calc.netExclVat), true)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">Contractor Payouts</p>
              {row("Contractor Base", formatRand(calc.contractorBase))}
              {calc.isOwner
                ? row("Owner (DMG — no payout)", "R 0,00")
                : row(`Consultant (${(calc.consultantRate * 100).toFixed(0)}%)`, `− ${formatRand(calc.consultantPayout)}`)}
              {calc.isDrip && !calc.isOwner && row(
                `Consultant drip (${(calc.consultantDripRate * 100).toFixed(0)}%) — pending`,
                `− ${formatRand(calc.consultantDripPayout)}`,
                false,
                true,
              )}
              {row(`Debbie (${(calc.bookerRate * 100).toFixed(1)}%)`, `− ${formatRand(calc.bookerPayout)}`)}
              <div className="mt-4 pt-4 border-t border-[#2e2e2e]">
                {row("DMG Net", formatRand(calc.dmgNet), true)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Calculation — HolidayCorp */}
      {calc?.type === "hcorp" && (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] mb-3">HolidayCorp Summary</h2>
          {calc.paymentType === "full_finance" && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              Full Finance — first debit order expected in 30–60 days. Nothing paid out until first instalment arrives.
            </div>
          )}
          <div className="max-w-xs">
            {row("Deal Value (contract)", formatRand(calc.dealValue))}
            {calc.paymentType !== "full" && row(
              `Amount Received${calc.paymentType === "full_finance" ? " (none yet)" : ` (${(calc.pctPaid * 100).toFixed(0)}%)`}`,
              formatRand(calc.amountPaid),
            )}
            {calc.isOwner
              ? row("Owner (DMG — no payout)", "R 0,00")
              : row(
                  calc.paymentType === "full_finance"
                    ? "Agent Comm (payable on 1st instalment)"
                    : `Agent Comm${calc.paymentType === "deposit" ? ` (${(calc.pctPaid * 100).toFixed(0)}% upfront)` : ""}`,
                  `− ${formatRand(calc.consultantUpfront)}`,
                  false,
                  calc.paymentType === "full_finance",
                )}
            {row(
              calc.paymentType === "full_finance" ? "Debbie (payable on 1st instalment)" : "Debbie (pre-sales)",
              `− ${formatRand(calc.debbieUpfront)}`,
              false,
              calc.paymentType === "full_finance",
            )}
            {calc.paymentType === "deposit" && (
              <div className="py-2 text-xs text-[#aaa] border-b border-[#2e2e2e]">
                Balance pending: {formatRand(calc.dealValue - calc.amountPaid)} ({((1 - calc.pctPaid) * 100).toFixed(0)}%)
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-[#2e2e2e]">
              {row("DMG Net", formatRand(calc.dmgNet), true)}
            </div>
          </div>
        </section>
      )}

      {/* Notes */}
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
        <label className={labelClass}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="FICA status, special conditions, drip schedule..."
        />
      </section>

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      <button
        type="button"
        disabled={!calc || pending}
        onClick={handleSave}
        className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {pending ? "Saving…" : dealId ? "Update Deal" : "Save Deal"}
      </button>
    </div>
  )
}
