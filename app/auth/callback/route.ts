import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const sep = next.includes('?') ? '&' : '?'
    // Build the redirect response upfront so we can set cookies directly on it.
    // Using cookies() + NextResponse.redirect() separately can cause the session
    // cookies to be dropped in some Vercel/Next.js deployment configurations.
    let response = NextResponse.redirect(`${origin}${next}${sep}welcome=1`)

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On Vercel with a custom domain, request.url may contain the internal
      // Vercel hostname rather than the public domain. x-forwarded-host is the
      // reliable source of the public-facing host in production.
      const forwardedHost = request.headers.get('x-forwarded-host')
      if (forwardedHost) {
        const proto = request.headers.get('x-forwarded-proto') ?? 'https'
        response = NextResponse.redirect(`${proto}://${forwardedHost}${next}${sep}welcome=1`)
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
