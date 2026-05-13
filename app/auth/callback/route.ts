import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const supabaseError = searchParams.get("error")
  const supabaseErrorDesc = searchParams.get("error_description")
  const supabaseErrorCode = searchParams.get("error_code")

  // Supabase returned an error (e.g. token already used, expired)
  if (supabaseError) {
    const msg = encodeURIComponent(supabaseErrorDesc ?? supabaseErrorCode ?? supabaseError)
    return NextResponse.redirect(new URL(`/set-password?error=expired&reason=${msg}`, origin))
  }

  // Forward the invite code to the set-password page for client-side exchange
  if (code && next === "/set-password") {
    return NextResponse.redirect(new URL(`/set-password?code=${encodeURIComponent(code)}`, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
