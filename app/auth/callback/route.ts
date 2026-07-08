import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  // On Vercel with a custom domain, request.url may contain the internal
  // Vercel hostname rather than the public domain. x-forwarded-host is the
  // reliable source of the public-facing host in production.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const base = forwardedHost ? `${proto}://${forwardedHost}` : origin

  if (code) {
    const sep = next.includes('?') ? '&' : '?'

    // Capture cookies with their full options (Path, SameSite, Max-Age, etc.)
    // so they can be applied to the final response after we know the correct
    // redirect URL. Rebuilding the response via request.cookies.getAll() loses
    // all cookie options, scoping cookies to /auth/ instead of /, which breaks
    // the session handoff when the browser follows the redirect to /library.
    const capturedCookies: Parameters<typeof response.cookies.set>[] = []

    // Placeholder response so the setAll handler has something to reference.
    // It gets replaced below — do not return this directly.
    let response = NextResponse.redirect(`${base}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            // Capture full options for the final response rebuild
            cookiesToSet.forEach(({ name, value, options }) =>
              capturedCookies.push([name, value, options])
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Skip ?welcome=1 for intermediate auth pages (e.g. reset-password).
      // The welcome toast should only fire once the user is actually signed in.
      const welcomeSuffix = next.startsWith('/auth/') ? '' : `${sep}welcome=1`

      response = NextResponse.redirect(`${base}${next}${welcomeSuffix}`)

      // Apply session cookies with their original options (preserves Path=/,
      // SameSite, Max-Age, etc. so cookies are sent with subsequent requests).
      capturedCookies.forEach((args) => response.cookies.set(...args))

      return response
    }

    // Exchange failed — log the error so it's visible in Vercel function logs.
    console.error(
      '[auth/callback] exchangeCodeForSession failed:',
      error?.name ?? 'no error but missing session',
      error?.message ?? '',
    )
  }

  // Something went wrong — send back to login.
  // Use base (public domain) rather than origin, which on Vercel may be the
  // internal deployment hostname instead of the custom domain.
  return NextResponse.redirect(`${base}/login`)
}
