'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, AlertTriangle, Shield, Users, Clock } from 'lucide-react';
import { Footer } from '@/components/Footer';
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
          <p className="text-lg text-slate-600 dark:text-slate-400">
            RepliFast by Soulrise LLC
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Agreement to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                These Terms of Service ("Terms") govern your use of the RepliFast platform ("Service") 
                operated by Soulrise LLC, a limited liability company organized under the laws of the United States 
                ("Company," "we," "our," or "us").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
                any part of these Terms, then you may not access the Service.
              </p>
            </CardContent>
          </Card>

          {/* Description of Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                RepliFast is a Software-as-a-Service (SaaS) platform that integrates with Google Business Profile 
                API to help businesses manage and respond to customer reviews. Our Service includes:
              </p>
              <ul>
                <li>Automated fetching of business reviews from Google Business Profile</li>
                <li>AI-powered generation of professional review responses</li>
                <li>Automated posting of approved responses to Google Business Profile</li>
                <li>Review management dashboard and analytics</li>
                <li>Email notifications and reporting features</li>
              </ul>
              <p>
                The Service requires integration with your Google Business Profile account and explicit consent 
                for automated actions on your behalf.
              </p>
            </CardContent>
          </Card>

          {/* User Accounts and Registration */}
          <Card>
            <CardHeader>
              <CardTitle>User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Account Creation</h3>
              <ul>
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 18 years old to use the Service</li>
                <li>One account per business entity; multiple accounts may result in suspension</li>
              </ul>

              <h3>Account Security</h3>
              <ul>
                <li>You are responsible for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to suspend accounts that show signs of compromise</li>
              </ul>

              <h3>Google Business Profile Integration</h3>
              <ul>
                <li>You must own or have authorized access to the Google Business Profile you connect</li>
                <li>You consent to our Service accessing your Google Business Profile data as described in our Privacy Policy</li>
                <li>You can disconnect the integration at any time through your account settings</li>
              </ul>
            </CardContent>
          </Card>

          {/* License and Permitted Use */}
          <Card>
            <CardHeader>
              <CardTitle>License and Permitted Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>License Grant</h3>
              <p>
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license 
                to access and use the Service for your business purposes.
              </p>

              <h3>Permitted Uses</h3>
              <ul>
                <li>Managing and responding to legitimate customer reviews for your business</li>
                <li>Using AI-generated responses as drafts or suggestions for your review replies</li>
                <li>Analyzing review data and trends for your business improvement</li>
                <li>Exporting your data for backup or migration purposes</li>
              </ul>

              <h3>License Restrictions</h3>
              <p>You may not:</p>
              <ul>
                <li>Use the Service for any business you do not own or have authorization to represent</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Resell, redistribute, or sublicense the Service</li>
                <li>Use the Service to violate any laws or regulations</li>
                <li>Interfere with or disrupt the Service or its servers</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acceptable Use Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Prohibited Activities</h3>
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Generate fake, misleading, or deceptive review responses</li>
                <li>Respond to reviews in a way that violates Google's policies or guidelines</li>
                <li>Harass, threaten, or abuse customers or other users</li>
                <li>Post spam, promotional content unrelated to the review, or commercial solicitations</li>
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Attempt to manipulate search rankings or review systems</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
              </ul>

              <h3>Content Standards</h3>
              <ul>
                <li>All responses must be professional, honest, and relevant to the customer's review</li>
                <li>Responses should comply with Google Business Profile content policies</li>
                <li>You are responsible for reviewing and approving all automated responses</li>
                <li>We reserve the right to disable automation features if misused</li>
              </ul>

              <h3>Compliance with Google Policies</h3>
              <p>
                You agree to comply with all applicable Google policies, including but not limited to:
              </p>
              <ul>
                <li>Google Business Profile Guidelines</li>
                <li>Google API Terms of Service</li>
                <li>Google Business Profile Content Policies</li>
              </ul>
            </CardContent>
          </Card>

          {/* Subscription and Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription and Payment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Subscription Plans</h3>
              <ul>
                <li>The Service is offered on a subscription basis with various pricing tiers</li>
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as expressly stated in these Terms</li>
              </ul>

              <h3>Payment Terms</h3>
              <ul>
                <li>Payment is due immediately upon subscription or renewal</li>
                <li>We use third-party payment processors (Stripe) to handle payment processing</li>
                <li>You authorize us to charge your payment method for all applicable fees</li>
                <li>Failed payments may result in service suspension or termination</li>
              </ul>

              <h3>Refunds and Cancellation</h3>
              <ul>
                <li>You may cancel your subscription at any time through your account settings</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>No refunds are provided for partial months or unused portions of your subscription</li>
                <li>We may offer refunds at our sole discretion for exceptional circumstances</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data and Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data and Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Data Ownership</h3>
              <ul>
                <li>You retain ownership of your business data and review responses</li>
                <li>We do not claim ownership of your Google Business Profile data</li>
                <li>You grant us a license to process your data solely to provide the Service</li>
              </ul>

              <h3>Data Processing</h3>
              <ul>
                <li>We process your data in accordance with our Privacy Policy</li>
                <li>Review text content is cached for maximum 30 days, then automatically purged</li>
                <li>Generated responses and metadata are stored for service functionality</li>
                <li>All data is encrypted at rest and in transit</li>
              </ul>

              <h3>Google API Compliance</h3>
              <ul>
                <li>Our use of Google API data complies with Google API Services User Data Policy</li>
                <li>We do not sell your Google data to third parties</li>
                <li>We do not use your data for advertising or unrelated purposes</li>
                <li>You can revoke our access to your Google data at any time</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Service Availability and Modifications</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Service Uptime</h3>
              <ul>
                <li>We strive to maintain high service availability but do not guarantee 100% uptime</li>
                <li>Scheduled maintenance will be announced in advance when possible</li>
                <li>We are not liable for service interruptions beyond our reasonable control</li>
              </ul>

              <h3>Service Modifications</h3>
              <ul>
                <li>We may modify, update, or discontinue features of the Service at any time</li>
                <li>Material changes will be communicated through email or in-app notifications</li>
                <li>Continued use of the Service constitutes acceptance of modifications</li>
              </ul>

              <h3>Third-Party Dependencies</h3>
              <ul>
                <li>The Service depends on Google Business Profile API availability</li>
                <li>Changes to Google's APIs or policies may affect Service functionality</li>
                <li>We will make reasonable efforts to adapt to third-party changes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Service Disclaimers</h3>
              <p className="uppercase font-semibold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                WHETHER EXPRESS OR IMPLIED.
              </p>
              <ul>
                <li>We do not warrant that the Service will be uninterrupted, error-free, or secure</li>
                <li>We do not guarantee the accuracy or quality of AI-generated responses</li>
                <li>We disclaim all warranties including merchantability, fitness for a particular purpose, and non-infringement</li>
              </ul>

              <h3>AI-Generated Content</h3>
              <ul>
                <li>AI-generated responses are suggestions only and require your review and approval</li>
                <li>You are responsible for all responses posted to your Google Business Profile</li>
                <li>We do not guarantee the appropriateness or effectiveness of AI-generated content</li>
                <li>You should review all automated responses before they are posted</li>
              </ul>

              <h3>Third-Party Services</h3>
              <ul>
                <li>We are not responsible for the availability or functionality of Google's services</li>
                <li>Changes to Google's policies or APIs may affect our Service</li>
                <li>We disclaim liability for third-party service interruptions or changes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Liability Limitations</h3>
              <p className="uppercase font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOULRISE LLC SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
              </p>
              
              <h3>Damages Cap</h3>
              <p>
                Our total liability to you for all claims arising from or relating to the Service shall not 
                exceed the amount you paid us in the twelve (12) months preceding the claim, or $100, 
                whichever is greater.
              </p>

              <h3>Excluded Damages</h3>
              <p>We are not liable for:</p>
              <ul>
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Loss of data or information</li>
                <li>Business interruption or downtime</li>
                <li>Damage to reputation or customer relationships</li>
                <li>Third-party actions or omissions</li>
              </ul>

              <h3>Exceptions</h3>
              <p>
                Nothing in these Terms limits our liability for fraud, gross negligence, or violations 
                of applicable law where such limitations are prohibited.
              </p>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle>Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                You agree to indemnify, defend, and hold harmless Soulrise LLC, its officers, directors, 
                employees, and agents from and against any claims, damages, losses, costs, and expenses 
                (including reasonable attorneys' fees) arising from or relating to:
              </p>
              <ul>
                <li>Your use of the Service in violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Your violation of any third-party rights</li>
                <li>Content you post or responses you publish through the Service</li>
                <li>Your breach of these Terms or our Privacy Policy</li>
              </ul>
              <p>
                We reserve the right to assume the exclusive defense and control of any matter subject 
                to indemnification by you, and you agree to cooperate with our defense of such claims.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Termination by You</h3>
              <ul>
                <li>You may terminate your account at any time through your account settings</li>
                <li>Termination takes effect immediately upon request</li>
                <li>You remain responsible for all charges incurred prior to termination</li>
              </ul>

              <h3>Termination by Us</h3>
              <p>We may terminate or suspend your account immediately if:</p>
              <ul>
                <li>You breach these Terms or our Acceptable Use Policy</li>
                <li>Your account shows signs of fraudulent or abusive activity</li>
                <li>You fail to pay applicable fees</li>
                <li>We are required to do so by law or court order</li>
              </ul>

              <h3>Effect of Termination</h3>
              <ul>
                <li>Your access to the Service will be immediately disabled</li>
                <li>Cached review text data will be purged within 7 business days</li>
                <li>You may export your generated responses and metadata before termination</li>
                <li>Certain provisions of these Terms will survive termination</li>
              </ul>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law and Disputes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Governing Law</h3>
              <p>
                These Terms are governed by and construed in accordance with the laws of the United States 
                and the state of Delaware, without regard to conflict of law principles.
              </p>

              <h3>Dispute Resolution</h3>
              <ul>
                <li>Any disputes arising from these Terms will be resolved through binding arbitration</li>
                <li>Arbitration will be conducted under the rules of the American Arbitration Association</li>
                <li>The arbitration will take place in Delaware or via online proceedings</li>
                <li>You waive your right to participate in class action lawsuits</li>
              </ul>

              <h3>Exceptions to Arbitration</h3>
              <p>
                Either party may seek injunctive relief in court for intellectual property violations 
                or breaches of confidentiality obligations.
              </p>
            </CardContent>
          </Card>

          {/* General Provisions */}
          <Card>
            <CardHeader>
              <CardTitle>General Provisions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Entire Agreement</h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between 
                you and Soulrise LLC regarding the Service.
              </p>

              <h3>Modifications</h3>
              <ul>
                <li>We may modify these Terms at any time by posting updated terms on our website</li>
                <li>Material changes will be communicated via email or in-app notification</li>
                <li>Continued use of the Service constitutes acceptance of modified Terms</li>
              </ul>

              <h3>Severability</h3>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions 
                will remain in full force and effect.
              </p>

              <h3>Assignment</h3>
              <ul>
                <li>You may not assign or transfer your rights under these Terms</li>
                <li>We may assign these Terms in connection with a merger, acquisition, or sale of assets</li>
              </ul>

              <h3>Waiver</h3>
              <p>
                Our failure to enforce any provision of these Terms does not constitute a waiver of 
                that provision or any other provision.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Soulrise LLC</strong></p>
                <p>Email: legal@replifast.com</p>
                <p>Address: [Your Business Address]</p>
                <p>Phone: [Your Business Phone]</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                For technical support, please use support@replifast.com or contact us through your account dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
