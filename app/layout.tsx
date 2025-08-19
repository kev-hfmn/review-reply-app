'use client';

import { Geist, Indie_Flower } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

import ProtectedRoute from '@/contexts/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react"
// import { PostHogProvider } from '@/contexts/PostHogContext';
// import { PostHogErrorBoundary } from '@/components/PostHogErrorBoundary';

const geist = Geist({ subsets: ['latin'] });
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
      <body className={`${geist.className} ${indieFlower.variable}`}>
        <Analytics mode="auto" />
        <ThemeProvider>
          {/* <PostHogErrorBoundary>
            <PostHogProvider> */}
              <AuthProvider>
                  <ProtectedRoute>

                    <main>{children}</main>
                  </ProtectedRoute>
              </AuthProvider>
            {/* </PostHogProvider>
          </PostHogErrorBoundary> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
