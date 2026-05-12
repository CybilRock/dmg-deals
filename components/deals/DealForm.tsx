"use client"

import { useState, useMemo, useTransition } from "react"
import { formatRand } from "@/lib/utils"
import { saveDeal } from "@/app/actions/deals"

const SOURCE_BRANDS = [
  "Doctor Travel",
  "Advocate Travel",
  "Holiday Brokers",
  "Online",
  "Referral",
  "Walk-in",
]

const DEPOSIT_TYPES = [
  { value: "10pct",          label: "10% Deposit",            dmgRate: 0.45, consultantRate: 0.25 },
  { value: "25to49pct",      label: "25–49% Deposit",         dmgRate: 0.48, consultantRate: 0.26 },
  { value: "50pct",          label: "50% Deposit",            dmgRate: null, consultantRate: 0.30 },
  { value: "no_deposit",     label: "No Deposit (Full Finance)", dmgRate: 0.40, consultantRate: 0.10 },
  { value: "self_generated", label: "Self-Generated",         dmgRate: null, consultantRate: null },
  { value: "upgrade",        label: "Upgrade",                dmgRate: 0.30, consultantRate: 0.30 },
]

const HCORP_TERMS = [
  { value: "hcorp_3yr",  label: "3-Year  — R25,000",  dealValue: 25000, agentComm: 2500, debbiePreSales: 650  },
  { value: "hcorp_5yr",  label: "5-Year  — R54,000",  dealValue: 54000, agentComm: 5282, debbiePreSales: 1100 },
  { value: "hcorp_10yr", label: "10-Year — R75,000",  dealValue: 75000, agentComm: 7300, debbiePreSales: 1500 },
]

const POINT_PRICE = 20
const CONTRACTOR_BASE = 15.5

function calcRetentionRate(commission: number) {
  return commission > 150000 ? 0.15 : 0.10
}

// Debbie's tiered booker rate — applied to contractor base (points × R15.50)
// Tiers 2 & 3 are the same regardless of deposit type; only the lowest tier differs
function calcDebbieRate(dealValue: number, depositType: string): number {
  if (dealValue > 1_000_000) return 0.03
  if (dealValue > 500_000)   return 0.02
  return depositType === "no_deposit" ? 0.01 : 0.015
}

type Consultant = { id: string; name: string }

export default function DealForm({ consultants }: { consultants: Consultant[] }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    clientName:   "",
    clientPhone:  "",
    clientEmail:  "",
    sourceBrand:  "",
    product:      "DVC",
    consultantId: "",
    // DVC fields
    points:        "",
    depositType:   "",
    selfGenerated: false,
    // HCorp fields
    hcorpTerm: "",
    notes: "",
  })

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  // DVC calculation
  const calcDVC = useMemo(() => {
    if (form.product !== "DVC") return null
    const points = parseFloat(form.points) || 0
    if (!points || !form.depositType) return null

    const dep = DEPOSIT_TYPES.find((d) => d.value === form.depositType)
    if (!dep || dep.dmgRate === null || dep.consultantRate === null) return null

    let dmgRate        = dep.dmgRate
    let consultantRate = dep.consultantRate
    if (form.selfGenerated) {
      dmgRate        += 0.03
      consultantRate += 0.03
    }

    const dealValue      = points * POINT_PRICE
    const commission     = dealValue * dmgRate
    const retentionRate  = calcRetentionRate(commission)
    const retention      = commission * retentionRate
    const dmgReceives    = commission - retention
    const vat            = dmgReceives * (15 / 115)
    const netExclVat     = dmgReceives - vat

    const contractorBase   = points * CONTRACTOR_BASE
    const consultantPayout = contractorBase * consultantRate
    const bookerRate       = calcDebbieRate(dealValue, form.depositType)
    const bookerPayout     = contractorBase * bookerRate
    const dmgNet           = netExclVat - consultantPayout - bookerPayout

    return {
      type: "dvc" as const,
      dealValue, commission, dmgRate, retentionRate, retention,
      dmgReceives, vat, netExclVat, contractorBase,
      consultantRate, consultantPayout,
      bookerRate, bookerPayout,
      dmgNet,
    }
  }, [form.product, form.points, form.depositType, form.selfGenerated])

  // HolidayCorp calculation
  const calcHCorp = useMemo(() => {
    if (form.product !== "HolidayCorp") return null
    const term = HCORP_TERMS.find((t) => t.value === form.hcorpTerm)
    if (!term) return null
    return {
      type:          "hcorp" as const,
      dealValue:     term.dealValue,
      agentComm:     term.agentComm,
      debbiePreSales: term.debbiePreSales,
      dmgNet:        term.dealValue - term.agentComm - term.debbiePreSales,
    }
  }, [form.product, form.hcorpTerm])

  const calc = form.product === "HolidayCorp" ? calcHCorp : calcDVC

  const row = (label: string, value: string, highlight = false) => (
    <div key={label} className={`flex justify-between py-2 text-sm border-b border-[#2e2e2e] last:border-0 ${highlight ? "font-semibold" : ""}`}>
      <span className="text-[#555]">{label}</span>
      <span className={highlight ? "text-[#c9a84c]" : "text-[#f5f5f5]"}>{value}</span>
    </div>
  )

  const inputClass = "mt-1.5 w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
  const labelClass = "text-[10px] font-bold text-[#555] uppercase tracking-widest"

  return (
    <div className="space-y-6">
      {/* Client */}
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Full Name</label>
            <input
              value={form.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              className={inputClass}
              placeholder="e.g. Dr. John Smith"
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              value={form.clientPhone}
              onChange={(e) => set("clientPhone", e.target.value)}
              className={inputClass}
              placeholder="e.g. 082 000 0000"
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={form.clientEmail}
              onChange={(e) => set("clientEmail", e.target.value)}
              className={inputClass}
              placeholder="e.g. john@practice.co.za"
            />
          </div>
        </div>
      </section>

      {/* Deal */}
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Deal</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Consultant</label>
            <select
              value={form.consultantId}
              onChange={(e) => set("consultantId", e.target.value)}
              className={inputClass}
            >
              <option value="">Select consultant...</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Source Brand</label>
            <select
              value={form.sourceBrand}
              onChange={(e) => set("sourceBrand", e.target.value)}
              className={inputClass}
            >
              <option value="">Select...</option>
              {SOURCE_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
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

          {/* DVC-specific fields */}
          {form.product === "DVC" && (
            <>
              <div>
                <label className={labelClass}>Points</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => set("points", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className={labelClass}>Deposit Type</label>
                <select
                  value={form.depositType}
                  onChange={(e) => set("depositType", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {DEPOSIT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex items-center">
                <label className="flex items-center gap-2 text-sm text-[#a8a8a8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selfGenerated}
                    onChange={(e) => set("selfGenerated", e.target.checked)}
                    className="rounded border-[#2e2e2e] accent-[#c9a84c]"
                  />
                  Self-Generated (+3% bonus)
                </label>
              </div>
            </>
          )}

          {/* HolidayCorp-specific fields */}
          {form.product === "HolidayCorp" && (
            <div className="col-span-2">
              <label className={labelClass}>Membership Term</label>
              <select
                value={form.hcorpTerm}
                onChange={(e) => set("hcorpTerm", e.target.value)}
                className={inputClass}
              >
                <option value="">Select term...</option>
                {HCORP_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Live Calculation — DVC */}
      {calc?.type === "dvc" && (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] mb-3">Live Calculation</h2>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">DMG Income from DHR</p>
              {row("Deal Value", formatRand(calc.dealValue))}
              {row(`Commission (${(calc.dmgRate * 100).toFixed(0)}%)`, formatRand(calc.commission))}
              {row(`Retention (${(calc.retentionRate * 100).toFixed(0)}%)`, `− ${formatRand(calc.retention)}`)}
              {row("DMG Receives", formatRand(calc.dmgReceives))}
              {row("VAT (15/115)", `− ${formatRand(calc.vat)}`)}
              {row("Net excl. VAT", formatRand(calc.netExclVat), true)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">Contractor Payouts</p>
              {row("Contractor Base", formatRand(calc.contractorBase))}
              {row(`Consultant (${(calc.consultantRate * 100).toFixed(0)}%)`, `− ${formatRand(calc.consultantPayout)}`)}
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
          <div className="max-w-xs">
            {row("Deal Value", formatRand(calc.dealValue))}
            {row("Agent Commission", `− ${formatRand(calc.agentComm)}`)}
            {row("Debbie (pre-sales)", `− ${formatRand(calc.debbiePreSales)}`)}
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

      <button
        type="button"
        disabled={!calc || pending}
        onClick={() => {
          if (!calc) return
          startTransition(() => {
            if (calc.type === "dvc") {
              saveDeal({
                clientName:       form.clientName,
                clientPhone:      form.clientPhone,
                clientEmail:      form.clientEmail,
                sourceBrand:      form.sourceBrand,
                product:          "DVC",
                points:           parseFloat(form.points),
                depositType:      form.depositType,
                selfGenerated:    form.selfGenerated,
                consultantId:     form.consultantId,
                dealValue:        calc.dealValue,
                dmgRate:          calc.dmgRate,
                commission:       calc.commission,
                retentionRate:    calc.retentionRate,
                retention:        calc.retention,
                dmgReceives:      calc.dmgReceives,
                vat:              calc.vat,
                netExclVat:       calc.netExclVat,
                contractorBase:   calc.contractorBase,
                consultantRate:   calc.consultantRate,
                consultantPayout: calc.consultantPayout,
                bookerRate:       calc.bookerRate,
                bookerPayout:     calc.bookerPayout,
                dmgNet:           calc.dmgNet,
                notes:            form.notes,
              })
            } else {
              saveDeal({
                clientName:       form.clientName,
                clientPhone:      form.clientPhone,
                clientEmail:      form.clientEmail,
                sourceBrand:      form.sourceBrand,
                product:          "HolidayCorp",
                points:           0,
                depositType:      form.hcorpTerm,
                selfGenerated:    false,
                consultantId:     form.consultantId,
                dealValue:        calc.dealValue,
                dmgRate:          0,
                commission:       calc.dealValue,
                retentionRate:    0,
                retention:        0,
                dmgReceives:      calc.dealValue,
                vat:              0,
                netExclVat:       calc.dealValue,
                contractorBase:   0,
                consultantRate:   0,
                consultantPayout: calc.agentComm,
                bookerRate:       0,
                bookerPayout:     calc.debbiePreSales,
                dmgNet:           calc.dmgNet,
                notes:            form.notes,
              })
            }
          })
        }}
        className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {pending ? "Saving…" : "Save Deal"}
      </button>
    </div>
  )
}
