import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code   = searchParams.get("code")
  const intent = searchParams.get("intent")
  const type   = searchParams.get("type")

  const redirectTarget = (intent === "invite" || type === "recovery")
    ? new URL("/portal/set-password", origin)
    : new URL("/", origin)

  const supabaseResponse = NextResponse.redirect(redirectTarget)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return supabaseResponse
}
