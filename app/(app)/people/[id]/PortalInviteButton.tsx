"use client"

import { sendPortalInvite } from "@/app/actions/auth"
import { useTransition, useState } from "react"

export default function PortalInviteButton({ personId, disabled }: { personId: string; disabled: boolean }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
        Invite sent ✓
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await sendPortalInvite(personId)
            if (result?.error) {
              setError(result.error)
            } else {
              setDone(true)
            }
          })
        }}
        className="text-xs font-semibold bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? "Sending…" : "Send Portal Invite"}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 max-w-[220px] text-right">{error}</p>
      )}
    </div>
  )
}
