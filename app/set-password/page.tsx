"use client"

import { Suspense } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const inputClass = "w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"

function SetPasswordForm() {
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
    // Implicit flow: Supabase puts tokens in the URL hash (#access_token=...&refresh_token=...)
    // Hash fragments are browser-only — never sent to the server — so we read them here
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (error || !data.session) {
              setError(error?.message ?? "This invite link has expired. Ask your admin to re-send the invite.")
            } else {
              setReady(true)
            }
          })
        return
      }
    }

    // Token hash flow (custom email template, scanner-safe)
    const tokenHash = searchParams.get("token_hash")
    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" }).then(({ data, error }) => {
        if (error || !data.session) {
          setError(error?.message ?? "This invite link has expired. Ask your admin to re-send the invite.")
        } else {
          setReady(true)
        }
      })
      return
    }

    // PKCE code flow (server callback forwarded code)
    const code = searchParams.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
        if (error || !session) {
          setError(error?.message ?? "This invite link has expired. Ask your admin to re-send the invite.")
        } else {
          setReady(true)
        }
      })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError("This invite link has expired. Ask your admin to re-send the invite.")
    })
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

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6 space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#f5f5f5]">Set your password</p>
        <p className="text-xs text-[#aaa] mt-1">Choose a password to secure your portal access.</p>
      </div>

      {error ? (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>
      ) : !ready ? (
        <p className="text-xs text-[#aaa]">Verifying your invite…</p>
      ) : (
        <>
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

          <button
            type="button"
            disabled={!password || !confirm || pending}
            onClick={handleSubmit}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Set Password & Enter Portal"}
          </button>
        </>
      )}
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[#c9a84c] font-light text-lg tracking-[0.15em] leading-none">dream</p>
          <p className="text-white text-xs font-bold tracking-[0.25em] uppercase leading-none mt-1">Merchant Group</p>
          <p className="text-xs text-[#555] tracking-widest uppercase mt-2">My Portal</p>
        </div>
        <Suspense fallback={<div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6"><p className="text-xs text-[#aaa]">Loading…</p></div>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
