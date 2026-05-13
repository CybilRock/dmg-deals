"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const inputClass = "w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"

export default function SetPasswordPage() {
  const [password, setPassword]     = useState("")
  const [confirm, setConfirm]       = useState("")
  const [error, setError]           = useState<string | null>(null)
  const [ready, setReady]           = useState(false)
  const [pending, startTransition]  = useTransition()
  const router      = useRouter()
  const searchParams = useSearchParams()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Exchange PKCE code if present in URL
    const code = searchParams.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError("Invite link is invalid or has expired. Ask to be re-invited.")
        else setReady(true)
      })
      return
    }

    // For implicit flow (hash tokens) — Supabase SDK fires onAuthStateChange automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY")) {
        setReady(true)
      }
    })

    // Check if already authenticated (e.g. PKCE session set by server callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSubmit() {
    setError(null)
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("Passwords do not match.")

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return setError(error.message)
      router.replace("/portal")
    })
  }

  if (!ready && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-[#aaa]">Verifying your invite…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-[#f5f5f5]">Set your password</p>
            <p className="text-xs text-[#aaa] mt-1">Choose a password to secure your portal access.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Minimum 8 characters"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Repeat password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            disabled={!password || !confirm || pending || !ready}
            onClick={handleSubmit}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Set Password & Enter Portal"}
          </button>
        </div>
      </div>
    </div>
  )
}
