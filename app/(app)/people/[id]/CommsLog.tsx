"use client"

import { useState, useTransition } from "react"
import { Phone, Mail, MessageCircle, StickyNote, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { addCommsEntry, deleteCommsEntry } from "@/app/actions/comms"

type CommsEntry = {
  id: string
  created_at: string
  type: string
  direction: string | null
  summary: string
  logged_by: string | null
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  call:      { label: "Call",      icon: <Phone className="w-3.5 h-3.5" />,          color: "text-blue-400 bg-blue-400/10" },
  email:     { label: "Email",     icon: <Mail className="w-3.5 h-3.5" />,           color: "text-purple-400 bg-purple-400/10" },
  whatsapp:  { label: "WhatsApp",  icon: <MessageCircle className="w-3.5 h-3.5" />,  color: "text-emerald-400 bg-emerald-400/10" },
  note:      { label: "Note",      icon: <StickyNote className="w-3.5 h-3.5" />,     color: "text-amber-400 bg-amber-400/10" },
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })
}

export default function CommsLog({
  personId,
  initial,
}: {
  personId: string
  initial: CommsEntry[]
}) {
  const [entries, setEntries] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState("call")
  const [direction, setDirection] = useState("outbound")
  const [summary, setSummary] = useState("")
  const [loggedBy, setLoggedBy] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const needsDirection = type !== "note"

  function handleAdd() {
    startTransition(async () => {
      const result = await addCommsEntry({
        person_id: personId,
        type,
        direction: needsDirection ? direction : null,
        summary,
        logged_by: loggedBy,
      })
      if (result && "error" in result) {
        setError(result.error)
        return
      }
      setEntries([
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          type,
          direction: needsDirection ? direction : null,
          summary,
          logged_by: loggedBy || null,
        },
        ...entries,
      ])
      setSummary("")
      setError(null)
      setShowForm(false)
    })
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      const result = await deleteCommsEntry(entryId, personId)
      if (result && "error" in result) {
        setError(result.error)
        return
      }
      setEntries(entries.filter((e) => e.id !== entryId))
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Comms Log</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#c9a84c] hover:text-[#d4ab52] transition-colors"
        >
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Log entry"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl p-5 mb-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            {/* Type */}
            <div className="flex gap-2 flex-wrap">
              {(["call", "email", "whatsapp", "note"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    type === t
                      ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10"
                      : "border-[#2e2e2e] text-[#888] hover:border-[#555]"
                  }`}
                >
                  {TYPE_META[t].icon}
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>

            {/* Direction */}
            {needsDirection && (
              <div className="flex gap-2">
                {(["outbound", "inbound"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      direction === d
                        ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10"
                        : "border-[#2e2e2e] text-[#888] hover:border-[#555]"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What happened? Keep it brief."
            rows={3}
            className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] resize-none focus:outline-none focus:border-[#c9a84c] transition-colors"
          />

          <div className="flex items-center gap-3">
            <input
              value={loggedBy}
              onChange={(e) => setLoggedBy(e.target.value)}
              placeholder="Logged by (your name)"
              className="flex-1 bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !summary.trim()}
              className="bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Entry list */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
        {entries.length === 0 ? (
          <p className="p-5 text-sm text-[#888]">No comms logged yet.</p>
        ) : (
          <div className="divide-y divide-[#2e2e2e]">
            {entries.map((e) => {
              const meta = TYPE_META[e.type] ?? TYPE_META.note
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${meta.color}`}>
                    {meta.icon}
                    {meta.label}
                    {e.direction && (
                      <span className="opacity-60 normal-case font-normal">· {e.direction}</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#f5f5f5]">{e.summary}</p>
                    <p className="text-[11px] text-[#666] mt-0.5">
                      {formatDateTime(e.created_at)}
                      {e.logged_by ? ` · ${e.logged_by}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={isPending}
                    className="text-[#444] hover:text-red-400 transition-colors mt-0.5 shrink-0"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
