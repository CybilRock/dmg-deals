"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* DMG wordmark */}
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] font-light text-xl tracking-[0.2em]">dream</p>
          <p className="text-white text-sm font-bold tracking-[0.35em] uppercase">Merchant Group</p>
          <p className="text-[#aaa] text-[10px] tracking-[0.4em] uppercase mt-3">Deal Desk</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6 space-y-4">
          <div>
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
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-[#c9a84c] hover:text-[#b8943e] transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#aaa] tracking-widest uppercase mt-8">
          Internal Portal
        </p>
      </div>
    </div>
  )
}
