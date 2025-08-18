'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, FileText, Clock, Users } from 'lucide-react';
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
                This Privacy Policy describes how Soulrise LLC ("we," "our," or "us"), operating the RepliFast platform ("Service"), 
                collects, uses, and protects your information when you use our service. RepliFast integrates with Google Business Profile 
                API to help businesses manage and respond to customer reviews.
              </p>
              <p>
                We are committed to protecting your privacy and complying with applicable data protection laws, including the 
                Google API Services User Data Policy and Google Business Profile API requirements.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Account Information</h3>
              <ul>
                <li>Email address and authentication credentials</li>
                <li>Business profile information (name, address, phone number)</li>
                <li>Google Business Profile connection status and metadata</li>
              </ul>

              <h3>Google Business Profile Data</h3>
              <ul>
                <li>Business reviews (text content, ratings, timestamps) - stored temporarily (≤30 days)</li>
                <li>Review metadata (review IDs, reviewer names, response status) - stored long-term</li>
                <li>Generated AI replies and final published responses</li>
                <li>Business location and profile information</li>
              </ul>

              <h3>Usage Data</h3>
              <ul>
                <li>Service usage analytics and performance metrics</li>
                <li>Error logs and debugging information</li>
                <li>Activity logs for review management actions</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Service Provision</h3>
              <ul>
                <li>Fetch and display your business reviews from Google Business Profile</li>
                <li>Generate AI-powered responses to customer reviews</li>
                <li>Post approved responses to your Google Business Profile</li>
                <li>Send email notifications about new reviews and system status</li>
              </ul>

              <h3>Service Improvement</h3>
              <ul>
                <li>Analyze usage patterns to improve our service</li>
                <li>Debug technical issues and provide customer support</li>
                <li>Develop new features and enhance existing functionality</li>
              </ul>

              <h3>Legal and Security</h3>
              <ul>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
                <li>Protect against fraud, abuse, and security threats</li>
                <li>Respond to legal requests and protect our rights</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Storage and Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Storage and Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Storage Infrastructure</h3>
              <ul>
                <li><strong>Frontend and Backend:</strong> Hosted on Vercel's secure infrastructure</li>
                <li><strong>Database:</strong> Supabase (PostgreSQL) with encryption at rest</li>
                <li><strong>Authentication:</strong> Supabase Auth with industry-standard security</li>
              </ul>

              <h3>Data Retention</h3>
              <ul>
                <li><strong>Review Text Content:</strong> Cached for maximum 30 days, then automatically purged</li>
                <li><strong>Review Metadata:</strong> Stored long-term for service functionality</li>
                <li><strong>Generated Replies:</strong> Stored long-term for audit and reference purposes</li>
                <li><strong>Account Data:</strong> Retained until account deletion or service termination</li>
              </ul>

              <h3>Security Measures</h3>
              <ul>
                <li>All data encrypted in transit using TLS/SSL</li>
                <li>Sensitive data encrypted at rest in our databases</li>
                <li>Access controls and authentication for all system components</li>
                <li>Regular security audits and monitoring</li>
              </ul>
            </CardContent>
          </Card>

          {/* Google API Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Google API Services Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Limited Use Requirements</h3>
              <p>
                RepliFast's use of information received from Google APIs adheres to the 
                <a href="https://developers.google.com/terms/api-services-user-data-policy" 
                   className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </p>

              <h3>Data Use Restrictions</h3>
              <ul>
                <li>We do not sell your Google data to third parties</li>
                <li>We do not transfer your data to advertisers or data brokers</li>
                <li>We do not use your data for purposes unrelated to providing our service</li>
                <li>Human review of your data occurs only when necessary for debugging, security, or legal compliance, and only with your consent</li>
              </ul>

              <h3>User Consent and Control</h3>
              <ul>
                <li>Explicit opt-in consent required before auto-replying to reviews</li>
                <li>You can disconnect your Google account at any time</li>
                <li>Upon disconnection, cached review data is immediately purged</li>
                <li>You can export your replies and metadata before account termination</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing and Third Parties</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Service Providers</h3>
              <p>We share data with trusted service providers who assist in operating our service:</p>
              <ul>
                <li><strong>Vercel:</strong> Web hosting and application infrastructure</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Google:</strong> Business Profile API integration (your own data returned to you)</li>
              </ul>

              <h3>Legal Disclosures</h3>
              <p>We may disclose your information when required by law or to:</p>
              <ul>
                <li>Comply with legal process or government requests</li>
                <li>Protect our rights, property, or safety</li>
                <li>Prevent fraud or security threats</li>
                <li>Enforce our Terms of Service</li>
              </ul>

              <h3>Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred 
                as part of the business transaction, subject to the same privacy protections.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Account Control</h3>
              <ul>
                <li><strong>Access:</strong> View and download your account data and generated replies</li>
                <li><strong>Correction:</strong> Update your business profile and account information</li>
                <li><strong>Deletion:</strong> Delete your account and associated data</li>
                <li><strong>Disconnection:</strong> Disconnect Google Business Profile integration at any time</li>
              </ul>

              <h3>Communication Preferences</h3>
              <ul>
                <li>Control email notification settings in your account dashboard</li>
                <li>Opt out of marketing communications (service-related emails will continue)</li>
              </ul>

              <h3>Data Portability</h3>
              <ul>
                <li>Export your generated replies and review metadata</li>
                <li>Download account activity logs and settings</li>
              </ul>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card>
            <CardHeader>
              <CardTitle>International Users</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                RepliFast is operated from the United States. If you are accessing our service from outside 
                the United States, your information will be transferred to, stored, and processed in the 
                United States. By using our service, you consent to this transfer and processing.
              </p>
              <p>
                We implement appropriate safeguards to protect your information in accordance with applicable 
                data protection laws and regulations.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                RepliFast is not intended for use by children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If we become aware that we have 
                collected personal information from a child under 13, we will take steps to delete such 
                information promptly.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Changes to This Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. We will notify you of any material changes by:
              </p>
              <ul>
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to your registered email address</li>
                <li>Displaying a notice in your account dashboard</li>
              </ul>
              <p>
                Your continued use of RepliFast after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Soulrise LLC</strong></p>
                <p>Email: privacy@replifast.com</p>
                <p>Address: [Your Business Address]</p>
                <p>Phone: [Your Business Phone]</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                For Google API-related privacy concerns, you may also contact Google directly through their 
                privacy support channels.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
