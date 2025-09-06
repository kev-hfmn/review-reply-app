'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, FileText, Settings, Shield, Clock } from 'lucide-react';
import Footer from '@/components/Footer';
import { PublicNavigation } from '@/components/PublicNavigation';
import ManageCookiePreferences from '@/components/ManageCookiePreferences';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <PublicNavigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Cookie className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: 19. August 2025
          </p>
          <div className="mt-6">
            <ManageCookiePreferences />
          </div>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                This Cookie Policy explains how RepliFast (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by SOULRISE LLC, uses cookies and similar technologies when you visit our website or use our Service. It should be read together with our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                1. What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Cookies are small text files stored on your device when you visit a website. They help websites function, improve performance, and provide insights into how services are used.
              </p>
              <p>
                We also use related technologies such as local storage, session storage, and tracking pixels.
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies We Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                2. Types of Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>a) Strictly Necessary Cookies</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Required for the platform to function.</li>
                <li>Include session cookies for authentication and security.</li>
                <li>Set by our hosting provider Vercel, which processes these cookies and server logs on servers located in the European Union.</li>
              </ul>

              <h3>b) Functional Cookies</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Store your settings and preferences (e.g., language, login state).</li>
                <li>Help us provide a smoother user experience.</li>
              </ul>

              <h3>c) Analytics and Performance Cookies</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We use Google Analytics to understand how visitors use our website and improve our Service.</li>
                <li>Google Analytics sets cookies that collect usage information (such as pages visited, time on site, device/browser type).</li>
                <li>We have enabled IP anonymization so that your full IP address is not stored.</li>
                <li>Google may process this data on servers outside the EU.</li>
              </ul>

              <p>You can learn more here: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">How Google uses data</a>.</p>
            </CardContent>
          </Card>

          {/* Legal Basis for Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                3. Legal Basis for Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>For users in the EEA, UK, and Switzerland:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Strictly necessary cookies are processed on the basis of our legitimate interest in providing a secure and functional website.</li>
                <li>All other cookies (e.g., analytics) are only set if you give explicit consent through our cookie banner.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How You Can Control Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                4. How You Can Control Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You can manage or withdraw your consent at any time via our cookie banner.</li>
                <li>Most browsers let you block or delete cookies in their settings.</li>
                <li>You can opt out of Google Analytics tracking with this browser add-on: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google Analytics Opt-out</a>.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to This Cookie Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                5. Changes to This Cookie Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update this Cookie Policy from time to time. Any updates will be posted on this page with a new &quot;Last updated&quot; date.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                6. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>If you have any questions about our Cookie Policy, please contact us:</p>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mt-4">
                <p><strong>SOULRISE LLC</strong></p>
                <p>Email: hello@soulrise.us</p>
                <p>Address: 2125 Biscayne Boulevard, STE 204 #13423, Miami, Florida 33137</p>
              </div>
              
              <div className="mt-6 flex justify-center">
                <ManageCookiePreferences variant="default" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
