import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // For invite flows, forward the code to the destination page for client-side exchange.
  // Server-side exchange fails because there is no PKCE code_verifier in cookies
  // (no prior client-side auth request was made — the invite was initiated server-side).
  if (code && next === "/set-password") {
    return NextResponse.redirect(new URL(`/set-password?code=${encodeURIComponent(code)}`, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
