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
              RepliFast (“we”, “our”, or “the Service”) is a product operated by SOULRISE LLC, a limited liability company registered in the United States. This Privacy Policy explains how we collect, use, store, and protect information when you use RepliFast.
                We operate an online platform ("Service") that helps businesses manage Google reviews and generate review replies. This Privacy Policy explains how we collect, use, share, and protect your information when you use our Service. By using RepliFast, you agree to the terms of this Privacy Policy.
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
                <li>Account details such as name, email address, and payment information (via Stripe).</li>
                <li>Business details including Google Business Profile information.</li>
                <li>Preferences, settings, and instructions you provide within the platform.</li>
              </ul>

              <h3>Information We Access From Google</h3>
              <p>With your authorization, we access:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Business profile information.</li>
                <li>Customer reviews and associated metadata.</li>
                <li>Permissions to post replies on your behalf.</li>
              </ul>
              <p>We use this data solely to provide the Service and do not sell or share it with third parties outside of our subprocessors.</p>

              <h3>Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Log data such as IP address, browser type, and usage metrics.</li>
                <li>Device information and cookies to improve functionality and analytics.</li>
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
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>To provide, operate, and maintain the Service.</li>
                <li>To fetch and manage your business reviews and generate replies.</li>
                <li>To customize replies based on your selected settings.</li>
                <li>To send notifications about new reviews, replies, and account activity.</li>
                <li>To process payments and manage subscriptions.</li>
                <li>To comply with legal and regulatory obligations.</li>
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
                Our Service connects to your Google Business Profile with your permission for the sole purpose of helping you manage and reply to customer reviews.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Limited Use:</strong> We only use Google data to provide review management services. We do not resell, share, or use Google data for advertising or unrelated purposes.</li>
                <li><strong>Data Retention:</strong> Review data retrieved from Google may be stored for up to 30 days for operational purposes. After 30 days, data is automatically deleted or refreshed directly from Google.</li>
                <li><strong>Transparency:</strong> All replies are either approved by you or sent using rules you configure. We do not make changes to your account without your knowledge.</li>
                <li><strong>Data Deletion:</strong> If you disconnect your account or terminate your subscription, all Google data associated with your account will be deleted within 7 days.</li>
                <li><strong>Security:</strong> We securely store access tokens and use them only to communicate with Google's APIs. We never ask for or store your Google password.</li>
                <li><strong>Independence:</strong> We are not owned by, operated by, or formally affiliated with Google. Our platform uses the official Google Business Profile API under their Terms of Service.</li>
                <li><strong>Policy Compliance:</strong> We comply with the Google API Services User Data Policy, including the Limited Use requirements.</li>
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
                Replies may be generated using third-party AI services (e.g., OpenAI). While you may edit or approve replies, you remain responsible for the final content posted under your business profile. RepliFast is not liable for any harm or claims resulting from AI-generated content.
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
              <p>We do not sell your information. We only share it with trusted third-party service providers essential for operating the Service:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Supabase (database and authentication)</li>
                <li>Stripe (billing and payments)</li>
                <li>OpenAI (reply generation)</li>
                <li>Email service provider (transactional email delivery)</li>
                <li>Analytics tools (for product improvement)</li>
              </ul>
              <p>Each third party only processes data on our behalf under strict contractual obligations.</p>
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
                <li>Account data and reviews are retained while your account is active.</li>
                <li>Upon request or account termination, your data will be deleted within 30 days, except where legally required to retain it.</li>
                <li>You may contact us at hello@soulrise.us to request deletion of your data.</li>
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
                We use encryption, secure storage, and access controls to protect your data. No system is 100% secure, and you use the Service at your own risk.
              </p>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                8. International Users
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you are located in the European Economic Area (EEA) or the UK, you have rights under GDPR, including the right to access, correct, or delete your data, and the right to data portability.
              </p>
              <p>
                If you are a California resident, you have rights under CCPA, including the right to know what data we collect and to request deletion.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                9. Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Our Service is not directed at children under 13, and we do not knowingly collect data from them. If we learn that we have inadvertently collected such data, we will delete it promptly.
              </p>
            </CardContent>
          </Card>

          {/* Service Limitations and Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                10. Service Limitations and Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access to Google services depends on Google's approval process. Initial setup may require you to authorize RepliFast to access your account, and approval can take up to two weeks.</li>
                <li>We are not responsible for delays, denials, or interruptions caused by Google's approval process or API availability.</li>
                <li>We are not liable for lost business, reputational damage, or indirect damages arising from use of the Service.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                11. Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update this Privacy Policy from time to time. Updates will be posted on this page with a new "Last Updated" date. Continued use of the Service after updates constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                12. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>If you have questions about this Privacy Policy, contact us at:</p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Soulrise LLC</strong></p>
                <p>Email: hello@soulrise.us</p>
                <p>Address: 2125 Biscayne Boulevard, STE 204 #13423, Miami, Florida 33137</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
