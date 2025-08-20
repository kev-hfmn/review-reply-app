import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://replifast.com"),
  title: {
    default: "Google review reply automation | RepliFast",
    template: "%s | RepliFast"
  },
  description:
    "RepliFast is a Google review response tool for small businesses. Automate Google review replies with on‑brand responses, daily auto‑sync, and optional auto‑approve.",
  keywords: [
    "google review reply automation",
    "reply to Google reviews automatically",
    "google review response tool",
    "google business profile reviews",
    "daily review sync",
    "auto‑approve review replies",
    "review reply software",
    "reputation management replies"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RepliFast",
    title: "Google review reply automation | RepliFast",
    description:
      "Automate your Google review replies with on‑brand responses. Daily auto‑sync and optional auto‑approve for 4–5★ reviews.",
    url: "https://replifast.com",
    images: [
      {
        url: "/RepliFast-logo.png",
        width: 1200,
        height: 630,
        alt: "RepliFast – Google review reply automation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Google review reply automation | RepliFast",
    description:
      "Automate your Google review replies with on‑brand responses. Daily auto‑sync and optional auto‑approve for 4–5★ reviews.",
    images: ["/RepliFast-logo.png"],
    creator: "@replifast"
  },
  robots: {
    index: true,
    follow: true
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest"
};