"use client"

import { Suspense } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const inputClass = "w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"

function SetPasswordForm() {
  const [password, setPassword]         = useState("")
  const [confirm, setConfirm]           = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [ready, setReady]               = useState(false)
  const [pending, startTransition]      = useTransition()
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
              setError(error?.message ?? "This link has expired or is invalid. Please request a new one.")
            } else {
              setReady(true)
            }
          })
        return
      }
    }

    // Token hash flow (custom email template, scanner-safe)
    const tokenHash = searchParams.get("token_hash")
    const tokenType = (searchParams.get("type") ?? "signup") as "signup" | "invite" | "recovery"
    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType }).then(({ data, error }) => {
        if (error || !data.session) {
          setError(error?.message ?? "This link has expired or is invalid. Please request a new one.")
        } else {
          setReady(true)
        }
      })
      return
    }

    // PKCE code flow — only works in the same browser session that initiated it
    // If we land here from a different device/browser, exchange will always fail; show friendly error
    const code = searchParams.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
        if (error || !session) {
          setError("EXPIRED_LINK")
        } else {
          setReady(true)
        }
      })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError("This link has expired or is invalid. Please request a new one.")
    })
  }, [])

  function handleSubmit() {
    setError(null)
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("Passwords do not match.")

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return setError(error.message)
      router.replace("/")
    })
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6 space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#f5f5f5]">Set your password</p>
        <p className="text-xs text-[#aaa] mt-1">Choose a password to secure your portal access.</p>
      </div>

      {error === "EXPIRED_LINK" ? (
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold text-[#f5f5f5]">This link has expired</p>
          <p className="text-xs text-[#888]">Password reset links can only be used once and expire after a short time.</p>
          <Link
            href="/forgot-password"
            className="block mt-3 w-full bg-[#c9a84c] hover:bg-[#b8943e] text-black font-bold py-2.5 rounded-xl text-sm transition-colors text-center"
          >
            Request a new link
          </Link>
          <Link href="/login" className="block text-xs text-[#a8a8a8] hover:text-[#f5f5f5] transition-colors pt-1">
            Back to sign in
          </Link>
        </div>
      ) : !ready ? (
        <p className="text-xs text-[#aaa]">Verifying your invite…</p>
      ) : (
        <>
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">New Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 pr-10 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
                placeholder="Minimum 8 characters"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Confirm Password</label>
            <div className="relative mt-1.5">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 pr-10 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
                placeholder="Repeat password"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            disabled={!password || !confirm || pending}
            onClick={handleSubmit}
            className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Set Password"}
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
