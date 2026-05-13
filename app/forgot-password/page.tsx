"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] font-light text-xl tracking-[0.2em]">dream</p>
          <p className="text-white text-sm font-bold tracking-[0.35em] uppercase">Merchant Group</p>
          <p className="text-[#aaa] text-[10px] tracking-[0.4em] uppercase mt-3">Deal Desk</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm font-semibold text-[#f5f5f5]">Check your email</p>
              <p className="text-xs text-[#888]">
                A password reset link has been sent to <span className="text-[#c9a84c]">{email}</span>.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-xs text-[#a8a8a8] hover:text-[#f5f5f5] transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-[#888] mb-4">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>

              <Link
                href="/login"
                className="block text-center text-xs text-[#a8a8a8] hover:text-[#f5f5f5] transition-colors pt-1"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-[#aaa] tracking-widest uppercase mt-8">
          Internal Portal
        </p>
      </div>
    </div>
  )
}
