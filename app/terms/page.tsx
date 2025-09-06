'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, AlertTriangle, Shield, Users, Clock, Eye, Lock, Globe } from 'lucide-react';
import Footer from '@/components/Footer';
import { PublicNavigation } from '@/components/PublicNavigation';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <PublicNavigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
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
                RepliFast is a product operated by SOULRISE LLC. These Terms of Service ("Terms") govern your use of the RepliFast platform ("Service"). By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Agreement to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                By using the Service, you agree to be bound by these Terms and our Privacy Policy. If you are entering into this agreement on behalf of a company, you represent that you are authorized to do so. You must be at least 18 years old to use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Description of Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                RepliFast is a Software-as-a-Service (SaaS) tool that integrates with Google Business Profile to help businesses manage and reply to customer reviews. Features include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fetching reviews from Google Business Profile</li>
                <li>AI-assisted draft generation of replies</li>
                <li>Manual or automatic posting of approved replies</li>
                <li>Daily automatic sync for Pro plans, manual sync for Starter plans</li>
                <li>Review management dashboard and reporting</li>
                <li>Email notifications about new reviews and replies</li>
              </ul>
              <p>
                To function, the Service requires connection to your Google Business Profile with your explicit authorization.
              </p>
            </CardContent>
          </Card>

          {/* User Accounts and Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                3. User Accounts and Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Account creation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You must provide accurate information when creating an account</li>
                <li>You are responsible for maintaining your account credentials</li>
                <li>One account per business entity</li>
              </ul>

              <h3>Account security</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You are responsible for all actions under your account</li>
                <li>Notify us if you suspect unauthorized access</li>
                <li>We may suspend accounts showing signs of compromise</li>
              </ul>

              <h3>Google Business Profile integration</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You must own or be authorized to manage the connected Google Business Profile</li>
                <li>You consent to RepliFast accessing your business profile and reviews solely for reply management</li>
                <li>You may revoke access at any time</li>
              </ul>
            </CardContent>
          </Card>

          {/* License and Permitted Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                4. License and Permitted Use
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We grant you a limited, non-exclusive, revocable license to use the Service for your own business.
              </p>

              <h3>Permitted uses:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Managing and responding to reviews for your own business</li>
                <li>Using AI-drafted responses as suggestions</li>
                <li>Exporting your own replies and review data</li>
              </ul>

              <h3>Restrictions:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Do not use the Service for businesses you do not own or represent</li>
                <li>Do not reverse engineer or attempt to bypass the Service</li>
                <li>Do not resell or sublicense the Service</li>
                <li>Do not use the Service for illegal purposes or to violate Google&apos;s policies</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acceptable Use Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                5. Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Prohibited activities:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Generating fake or misleading replies</li>
                <li>Harassing, threatening, or spamming customers</li>
                <li>Posting promotional content unrelated to reviews</li>
                <li>Attempting to manipulate ratings or search rankings</li>
              </ul>

              <h3>Content standards:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Replies must be professional and relevant</li>
                <li>Replies must comply with Google Business Profile content policies</li>
                <li>You are responsible for reviewing and approving replies before posting (unless auto-approval is enabled by you)</li>
              </ul>

              <h3>Compliance:</h3>
              <p>You must comply with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Google Business Profile Guidelines</li>
                <li>Google API Terms of Service</li>
                <li>Google API Services User Data Policy</li>
              </ul>
            </CardContent>
          </Card>

          {/* Subscriptions and Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                6. Subscriptions and Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The Service is offered via monthly or annual subscriptions</li>
                <li>Fees are billed in advance and are non-refundable, except as required by law</li>
                <li>Payments are processed securely via Stripe</li>
                <li>If your payment fails, we may suspend or terminate your account</li>
                <li>You may cancel anytime, with access continuing until the end of the billing period</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data and Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                7. Data and Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Data ownership</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You own your business data and review replies</li>
                <li>We only process your data to provide the Service</li>
              </ul>

              <h3>Google data use</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We only access your reviews and replies with your consent</li>
                <li>Review content is cached for no longer than 30 days</li>
                <li>If you disconnect Google or close your account, cached data is deleted within 7 days</li>
                <li>We do not sell or use your data for advertising</li>
                <li>Access tokens are stored securely and never shared</li>
              </ul>

              <h3>Security</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>We follow best practices to protect account credentials and prevent unauthorized access</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Availability and Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                8. Service Availability and Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We aim to maintain reliable uptime but do not guarantee uninterrupted service</li>
                <li>Maintenance or outages may occur</li>
                <li>We may modify, update, or discontinue features at any time</li>
                <li>Changes to Google&apos;s APIs or policies may affect functionality</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                9. Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The Service is provided &quot;as is&quot; without warranties of any kind</li>
                <li>We do not guarantee the accuracy or suitability of AI-generated replies</li>
                <li>You are solely responsible for reviewing replies before posting</li>
                <li>We are not liable for outages or changes caused by Google or other third parties</li>
              </ul>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                10. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is capped at the greater of $100 or the amount you paid us in the 12 months prior to the claim</li>
                <li>We are not liable for lost profits, lost data, or business interruption</li>
                <li>Nothing in these Terms limits liability for fraud, gross negligence, or where prohibited by law</li>
              </ul>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                11. Indemnification
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                You agree to indemnify and hold harmless SOULRISE LLC from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your misuse of the Service</li>
                <li>Your violation of these Terms or Google policies</li>
                <li>Content you publish through the Service</li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                12. Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You may cancel your account at any time</li>
                <li>We may suspend or terminate accounts for violations, non-payment, or security issues</li>
                <li>On termination, cached Google review data is deleted within 7 days</li>
                <li>Certain sections (liability, indemnity, data use) survive termination</li>
              </ul>
            </CardContent>
          </Card>

          {/* Governing Law and Disputes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                13. Governing Law and Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>These Terms are governed by the laws of Delaware, United States</li>
                <li>Disputes will be resolved via binding arbitration under the rules of the American Arbitration Association, unless you opt out within 30 days of accepting these Terms</li>
                <li>Class action participation is waived</li>
              </ul>
            </CardContent>
          </Card>

          {/* General Provisions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                14. General Provisions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>These Terms and the Privacy Policy are the entire agreement between you and SOULRISE LLC</li>
                <li>We may update these Terms at any time; changes will be posted on our website</li>
                <li>Continued use of the Service means acceptance of the changes</li>
                <li>If any part of these Terms is invalid, the rest remains enforceable</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                15. Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>If you have questions about these Terms:</p>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mt-4">
                <p><strong>SOULRISE LLC</strong></p>



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
