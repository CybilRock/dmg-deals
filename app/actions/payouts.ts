"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function createPayoutRun(formData: FormData) {
  const runType    = formData.get("run_type") as "friday_dhr" | "seventh_contractor"
  const runDate    = formData.get("run_date") as string
  const amount     = parseFloat(formData.get("amount") as string)
  const notes      = (formData.get("notes") as string)?.trim() || null

  if (!runType || !runDate || isNaN(amount) || amount <= 0) {
    throw new Error("Invalid payout run data")
  }

  const supabase = createAdminClient()

  const { data: run, error: runError } = await supabase
    .from("payout_runs")
    .insert({ run_type: runType, run_date: runDate, total_amount: amount, notes, status: "paid" })
    .select()
    .single()

  if (runError) throw new Error(runError.message)

  // Friday DHR payment reduces the DHR debt
  if (runType === "friday_dhr") {
    const { error: ledgerError } = await supabase.from("dhr_debt_ledger").insert({
      entry_type: "debt_repaid",
      amount,
      notes: `Friday payout run ${runDate}${notes ? ` — ${notes}` : ""}`,
    })
    if (ledgerError) throw new Error(ledgerError.message)
  }

  revalidatePath("/reports")
  revalidatePath("/dashboard")
  revalidatePath("/reports/dhr")
}
