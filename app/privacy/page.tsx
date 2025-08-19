'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, FileText, Clock, Users, AlertTriangle, Globe, Baby } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { PublicNavigation } from '@/components/PublicNavigation';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <PublicNavigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: 19. August 2025
          </p>
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
                RepliFast is a product operated by SOULRISE LLC, a limited liability company registered in the United States (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, share, store, and protect your information when you use RepliFast (&quot;the Service&quot;). By using the Service, you agree to this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Account details such as name, email address, and password.</li>
                <li>Business details, including Google Business Profile information you connect.</li>
                <li>Preferences, settings, and instructions you provide in the platform.</li>
                <li>Payment information processed securely by Stripe.</li>
                <li>Support requests and communication you send us.</li>
              </ul>

              <h3>Information We Access From Google (with your authorization)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Business profile information.</li>
                <li>Customer reviews and associated metadata.</li>
                <li>Permission to draft and post replies on your behalf.</li>
              </ul>
              <p>We use this data solely to provide the Service. We do not sell or share it with third parties except subprocessors listed in Section 5.</p>

              <h3>Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Log data such as IP address, browser type, and usage metrics.</li>
                <li>Device information and cookies for authentication, security, and analytics.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. How We Use Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide, operate, and maintain the Service.</li>
                <li>Fetch and manage your business reviews and generate replies.</li>
                <li>Draft replies based on your preferences and settings.</li>
                <li>Notify you about new reviews, replies, and account activity.</li>
                <li>Process payments and manage subscriptions.</li>
                <li>Comply with legal and regulatory obligations.</li>
                <li>Improve Service performance, reliability, and security.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Google API Disclosure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                3. Use of Google Business Profile API
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                The Service connects to your Google Business Profile only with your explicit consent.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Limited Use.</strong> Google data is used only to provide review management and reply functionality. We do not resell Google data, use it for advertising, or for unrelated purposes.</li>
                <li><strong>30-Day Retention.</strong> Review content and related data retrieved from Google may be cached for operational purposes but never longer than 30 calendar days. After 30 days, cached data is deleted or refreshed directly from Google.</li>
                <li><strong>Deletion on Disconnect.</strong> If you disconnect your Google account or terminate your subscription, all associated Google data is deleted within 7 days.</li>
                <li><strong>Transparency.</strong> Replies are posted only after you approve them or under rules you configure. No changes are made to your Google account without your knowledge.</li>
                <li><strong>Security.</strong> Access tokens are stored securely, encrypted in transit and at rest. We never ask for or store your Google password.</li>
                <li><strong>Independence.</strong> RepliFast is not affiliated with Google. We comply with the Google API Services User Data Policy and Google Business Profile API policies.</li>
              </ul>
            </CardContent>
          </Card>

          {/* AI-Generated Content Disclaimer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                4. AI-Generated Content Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may use third-party AI services (such as OpenAI) to draft review replies. You remain responsible for reviewing, approving, and publishing responses under your Google Business Profile. We are not liable for harm, claims, or reputational damage resulting from AI-generated content.
              </p>
            </CardContent>
          </Card>

          {/* Sharing of Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                5. Sharing of Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>We do not sell your data. We share it only with service providers who help us operate the Service, under strict contractual obligations:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Supabase (database and authentication)</li>
                <li>Stripe (billing and payments)</li>
                <li>OpenAI (reply generation)</li>
                <li>Email service provider (transactional emails)</li>
                <li>Analytics tools (product improvement)</li>
              </ul>
              <p>We may also disclose information if required by law or to protect rights, safety, or property.</p>
            </CardContent>
          </Card>

          {/* Data Retention and Deletion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                6. Data Retention and Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Account data is retained while your account is active.</li>
                <li>Google review data is cached for up to 30 days and then deleted or refreshed.</li>
                <li>On account closure or Google disconnect, all Google data is deleted within 7 days.</li>
                <li>Backup copies are overwritten on a rolling basis.</li>
                <li>You can request deletion at any time by contacting hello@soulrise.us.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                7. Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We implement encryption, access controls, and secure storage to protect your data. While we take industry-standard measures, no system is fully secure. You are responsible for keeping your account credentials safe.
              </p>
            </CardContent>
          </Card>

          {/* International Users and Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                8. International Users and Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you are located outside the United States, your data may be transferred to and processed in the US or other jurisdictions with different data protection laws. Where required, we rely on Standard Contractual Clauses or equivalent legal safeguards for such transfers.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                9. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>For EEA & UK Users (GDPR/UK GDPR):</h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access, correct, or delete your personal data.</li>
                <li>Restrict or object to processing.</li>
                <li>Data portability.</li>
                <li>Lodge a complaint with your local supervisory authority.</li>
              </ul>

              <h3>For California Users (CCPA):</h3>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Know what categories of personal information we collect and how we use it.</li>
                <li>Request deletion of your personal information.</li>
                <li>Opt out of &quot;sale&quot; of personal information (we do not sell data).</li>
                <li>Exercise rights without discrimination.</li>
              </ul>

              <p>Contact hello@soulrise.us to exercise these rights.</p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                10. Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We use cookies and similar technologies for login sessions, security, and basic analytics. You can manage cookies through your browser settings, but some features may not work if cookies are disabled.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                11. Children&apos;s Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                The Service is not directed to children under 13. We do not knowingly collect data from children under 13. If we learn we have inadvertently collected such data, we will delete it promptly.
              </p>
            </CardContent>
          </Card>

          {/* Service Limitations and Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                12. Service Limitations and Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Access to Google services depends on Google&apos;s approval and API availability. Initial setup may require authorization and Google&apos;s review, which may take up to two weeks.
              </p>
              <p>We are not responsible for delays, denials, or interruptions caused by Google.</p>
              <p>We are not liable for lost business, reputational damage, or indirect damages resulting from use of the Service.</p>
            </CardContent>
          </Card>

          {/* Changes to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                13. Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update this Privacy Policy periodically. Updates will be posted on this page with a revised &quot;Last Updated&quot; date. Material changes will be communicated where legally required. Continued use of the Service means acceptance of the updated Policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                14. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>SOULRISE LLC</strong></p>
                <p>2125 Biscayne Boulevard, STE 204 #13423</p>
                <p>Miami, Florida 33137, USA</p>
                <p>Email: hello@soulrise.us</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
