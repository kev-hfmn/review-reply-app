import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.replifast.com"),
  title: {
    default: "Reply to Google Reviews Automatically | RepliFast",
    template: "%s | RepliFast"
  },
  description:
    "Reply to Google reviews automatically with RepliFast. On-brand responses, daily sync, and auto-approve options to keep your business reputation strong.",
  keywords: [
    "google review reply automation",
    "reply to Google reviews automatically",
    "google review response tool",
    "google business profile reviews",
    "daily review sync",
    "auto‑approve review replies",
    "review reply software",
    "reputation management replies",
    "google review response automation",
    "google review respond tool",
    "respond to google reviews automatically",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RepliFast",
    title: "Reply to Google Reviews Automatically | RepliFast",
    description:
      "Automate your Google review replies with on‑brand responses. Daily auto‑sync and optional auto‑approve for 4–5★ reviews.",
    url: "https://www.replifast.com",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "RepliFast – Google review reply automation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Reply to Google Reviews Automatically | RepliFast",
    description:
      "Automate your Google review replies with on‑brand responses. Daily auto‑sync and optional auto‑approve for 4–5★ reviews.",
    images: ["/og.png"],
    creator: "@replifast"
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "https://www.replifast.com"
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};
