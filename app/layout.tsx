import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScriptProvider } from '@/context/ScriptContext';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { WelcomeToast } from '@/components/WelcomeToast';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'Round Door Studio · Bilingual stories for curious minds',
  description:
    'Mandarin and English stories for bilingual families, learners, and curious minds — with printable story packs, vocabulary, discussion prompts, and cultural activities.',
  icons: { icon: '/icons/round-door.png' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = (user?.user_metadata?.full_name as string | undefined) ?? null

  return (
    <html lang="en" data-script="simp" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=LXGW+WenKai+TC&family=Noto+Serif+TC&display=swap"
          rel="stylesheet"
        />
        {/* Set data-script from localStorage before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('rds-script')||'simp';document.documentElement.setAttribute('data-script',s);})()`
          }}
        />
        {/* Google Tag Manager */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KW6G42FG');`
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KW6G42FG"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ScriptProvider>
          <Nav userEmail={user?.email ?? null} userName={userName} />
          <main>{children}</main>
          <Footer />
          <Suspense>
            <WelcomeToast />
          </Suspense>
        </ScriptProvider>
      </body>
    </html>
  );
}
