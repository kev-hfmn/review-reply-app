import { Noto_Sans, Indie_Flower } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Providers from './providers';

import ProtectedRoute from '@/contexts/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react";
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
// import { PostHogProvider } from '@/contexts/PostHogContext';
// import { PostHogErrorBoundary } from '@/components/PostHogErrorBoundary';

// Re-export sitewide metadata so Next.js applies it from the root layout
export { metadata } from './metadata';

const notoSans = Noto_Sans({ subsets: ['latin'] });
const indieFlower = Indie_Flower({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-indie-flower',
  display: 'swap',
  preload: true
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "RepliFast",
              url: "https://www.replifast.com",
              logo: "https://www.replifast.com/logo.png",
              sameAs: []
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "RepliFast",
              url: "https://www.replifast.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.replifast.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "RepliFast",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", priceCurrency: "USD", price: "19", description: "Starter plan" },
                { "@type": "Offer", priceCurrency: "USD", price: "49", description: "Pro plan" }
              ]
            })
          }}
        />
      </head>
      <body className={`${notoSans.className} ${indieFlower.variable}`}>
        <Analytics mode="auto" />
        <GoogleAnalytics />
        <Providers>
          <ThemeProvider>
            {/* <PostHogErrorBoundary>
              <PostHogProvider> */}
                <AuthProvider>
                  <main>{children}</main>
                </AuthProvider>
              {/* </PostHogProvider>
            </PostHogErrorBoundary> */}

            {/* Cookie Consent Banner */}
            <CookieConsent />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
