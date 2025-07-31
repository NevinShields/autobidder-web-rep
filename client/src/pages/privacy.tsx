import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, UserCheck } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <img 
                  src={autobidderLogo} 
                  alt="Autobidder" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold text-gray-900">Autobidder</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-green-100">
              <Shield className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 31, 2025
          </p>
        </div>

        {/* Privacy Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We collect information you provide directly to us, information we obtain automatically when you use our services, and information from third parties.
              </p>
              
              <h4 className="text-lg font-semibold mt-6 mb-3">Information You Provide:</h4>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, password, business information</li>
                <li><strong>Profile Data:</strong> Business details, contact information, preferences</li>
                <li><strong>Content:</strong> Pricing calculators, formulas, lead data, customer information</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by Stripe)</li>
                <li><strong>Communications:</strong> Messages, support requests, feedback</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Information We Collect Automatically:</h4>
              <ul>
                <li><strong>Usage Data:</strong> Features used, time spent, interactions with the service</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Analytics:</strong> Page views, click patterns, user flows</li>
                <li><strong>Technical Data:</strong> Error logs, performance metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We use the information we collect to:</p>
              
              <h4 className="text-lg font-semibold mt-6 mb-3">Provide and Improve Services:</h4>
              <ul>
                <li>Operate and maintain your account</li>
                <li>Process transactions and billing</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to improve features</li>
                <li>Develop new products and services</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Communications:</h4>
              <ul>
                <li>Send service-related notifications</li>
                <li>Respond to your inquiries</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Provide product updates and announcements</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Legal and Security:</h4>
              <ul>
                <li>Comply with legal obligations</li>
                <li>Protect against fraud and abuse</li>
                <li>Enforce our terms of service</li>
                <li>Maintain system security</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                3. Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
              
              <h4 className="text-lg font-semibold mt-6 mb-3">Service Providers:</h4>
              <ul>
                <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
                <li><strong>Email Services:</strong> Resend and SendGrid for transactional emails</li>
                <li><strong>Analytics:</strong> Aggregated, anonymized data for service improvement</li>
                <li><strong>Cloud Infrastructure:</strong> Hosting and data storage providers</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Legal Requirements:</h4>
              <ul>
                <li>When required by law or legal process</li>
                <li>To protect our rights and property</li>
                <li>To prevent fraud or abuse</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">With Your Consent:</h4>
              <p>We may share information with third parties when you explicitly consent to such sharing.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                4. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We implement appropriate technical and organizational measures to protect your information:</p>
              
              <ul>
                <li><strong>Encryption:</strong> Data is encrypted in transit and at rest</li>
                <li><strong>Access Controls:</strong> Limited access on a need-to-know basis</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Secure Infrastructure:</strong> Industry-standard hosting and database security</li>
                <li><strong>Employee Training:</strong> Staff trained on data protection practices</li>
                <li><strong>Incident Response:</strong> Procedures for handling security breaches</li>
              </ul>

              <p className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <strong>Note:</strong> While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                5. Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>You have the following rights regarding your personal information:</p>
              
              <h4 className="text-lg font-semibold mt-6 mb-3">Access and Control:</h4>
              <ul>
                <li><strong>Access:</strong> Request copies of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Restrict Processing:</strong> Limit how we use your information</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Communication Preferences:</h4>
              <ul>
                <li>Opt out of marketing communications</li>
                <li>Update notification preferences</li>
                <li>Choose communication frequency</li>
              </ul>

              <h4 className="text-lg font-semibold mt-6 mb-3">Account Management:</h4>
              <ul>
                <li>Update your account information</li>
                <li>Change privacy settings</li>
                <li>Delete your account</li>
              </ul>

              <p className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                To exercise these rights, please contact us at privacy@autobidder.com or use the settings in your account dashboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>We retain your information for as long as necessary to:</p>
              <ul>
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6 mb-3">Retention Periods:</h4>
              <ul>
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Transaction Records:</strong> 7 years for tax and legal compliance</li>
                <li><strong>Support Communications:</strong> 3 years from last contact</li>
                <li><strong>Usage Analytics:</strong> Aggregated data retained indefinitely</li>
                <li><strong>Marketing Data:</strong> Until you opt out or object</li>
              </ul>

              <p>When you delete your account, we will delete your personal information within 30 days, except where retention is required by law.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Autobidder is based in the United States. If you are accessing our services from outside the U.S., please be aware that your information may be transferred to, stored, and processed in the United States.
              </p>
              <p>
                We ensure appropriate safeguards are in place for international data transfers, including:
              </p>
              <ul>
                <li>Compliance with applicable data protection laws</li>
                <li>Contractual protections with service providers</li>
                <li>Industry-standard security measures</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
              <p>
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately so we can delete such information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul>
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a notice in your account dashboard</li>
              </ul>
              <p>
                Your continued use of our services after changes become effective constitutes acceptance of the revised Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <ul>
                <li><strong>Email:</strong> privacy@autobidder.com</li>
                <li><strong>Support:</strong> <Link href="/support" className="text-blue-600 hover:underline">autobidder.com/support</Link></li>
                <li><strong>Mail:</strong> Autobidder, Inc., Privacy Officer, 123 Business Ave, Suite 100, San Francisco, CA 94105</li>
              </ul>
              
              <p className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <strong>Data Protection Officer:</strong> For EU residents, you can contact our Data Protection Officer at dpo@autobidder.com for any privacy-related inquiries.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Questions about your privacy?
            </h3>
            <p className="text-gray-600 mb-4">
              We're committed to transparency and protecting your personal information.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/support">
                <Button>Contact Support</Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline">View Terms & Conditions</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}