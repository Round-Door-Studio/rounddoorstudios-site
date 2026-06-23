import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const sep = next.includes('?') ? '&' : '?'
    // Build a placeholder redirect response upfront so the cookie setAll handler
    // can write directly onto a response object (mirrors the middleware pattern).
    // This gets replaced after the code exchange with the correct welcome suffix.
    let response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Mirror the middleware pattern: write to both the request (for
            // subsequent server reads) and directly onto the redirect response.
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Only show the welcome toast for genuinely new accounts (created within
      // the last 60 seconds). Returning users signing in via Google should not
      // see it, even on a new device where localStorage has no record.
      const createdAt = data.session?.user?.created_at
      const isNewUser = createdAt
        ? Date.now() - new Date(createdAt).getTime() < 60_000
        : false
      const welcomeSuffix = isNewUser ? `${sep}welcome=1` : ''

      // Rebuild the initial response now that we know whether to include welcome.
      response = NextResponse.redirect(`${origin}${next}${welcomeSuffix}`)
      request.cookies.getAll().forEach(({ name, value }) => {
        response.cookies.set(name, value)
      })

      // On Vercel with a custom domain, request.url may contain the internal
      // Vercel hostname rather than the public domain. x-forwarded-host is the
      // reliable source of the public-facing host in production.
      const forwardedHost = request.headers.get('x-forwarded-host')
      if (forwardedHost) {
        const proto = request.headers.get('x-forwarded-proto') ?? 'https'
        response = NextResponse.redirect(`${proto}://${forwardedHost}${next}${welcomeSuffix}`)
        // Re-copy cookies onto the new response object
        request.cookies.getAll().forEach(({ name, value }) => {
          response.cookies.set(name, value)
        })
      }
      return response
    }
  }

  // Something went wrong — send back to login
  return NextResponse.redirect(`${origin}/login`)
}
