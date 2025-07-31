import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, Users, AlertTriangle } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function TermsPage() {
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
            <div className="p-4 rounded-full bg-blue-100">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using Autobidder's services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 31, 2025
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                By accessing and using Autobidder ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These Terms and Conditions ("Terms") govern your relationship with Autobidder operated by Autobidder, Inc. ("us", "we", or "our").
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                2. Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Autobidder is a web-based platform that allows businesses to create, customize, and embed interactive pricing calculators. Our service includes:
              </p>
              <ul>
                <li>Pricing calculator creation and management tools</li>
                <li>Lead capture and management systems</li>
                <li>Business analytics and reporting</li>
                <li>Customer communication tools</li>
                <li>Website integration capabilities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                To access certain features of the Service, you must register for an account. When you register for an account, you may be required to provide certain information about yourself.
              </p>
              <p>You agree that:</p>
              <ul>
                <li>You will provide accurate, current, and complete information</li>
                <li>You will maintain and update your information to keep it accurate</li>
                <li>You are responsible for safeguarding your password</li>
                <li>You will not share your account with others</li>
                <li>You will notify us immediately of any unauthorized use</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscription and Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Autobidder offers various subscription plans with different features and pricing. Payment terms include:
              </p>
              <ul>
                <li><strong>Free Trial:</strong> New users receive a 14-day free trial</li>
                <li><strong>Billing:</strong> Subscriptions are billed monthly or annually in advance</li>
                <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled</li>
                <li><strong>Refunds:</strong> 30-day money-back guarantee for new subscribers</li>
                <li><strong>Price Changes:</strong> We may change pricing with 30 days notice</li>
              </ul>
              <p>
                You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Use the Service for illegal activities or fraud</li>
                <li>Spam or send unsolicited communications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Data and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p>
                You retain ownership of your business data and content. We may use aggregated, anonymized data to improve our services.
              </p>
              <Link href="/privacy">
                <Button variant="outline" className="mt-4">
                  View Privacy Policy
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                7. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                To the maximum extent permitted by law, Autobidder shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability for any claim arising out of or relating to these Terms or the Service shall not exceed the amount you paid us in the twelve months prior to the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                The Service and its original content, features, and functionality are owned by Autobidder and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <p>
                Upon termination, your right to use the Service will stop immediately. You may export your data for 30 days after termination.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service.
              </p>
              <p>
                Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <ul>
                <li>Email: legal@autobidder.com</li>
                <li>Website: <Link href="/support" className="text-blue-600 hover:underline">autobidder.com/support</Link></li>
                <li>Address: Autobidder, Inc., 123 Business Ave, Suite 100, San Francisco, CA 94105</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Questions about our Terms?
            </h3>
            <p className="text-gray-600 mb-4">
              Our support team is here to help clarify any questions you may have.
            </p>
            <Link href="/support">
              <Button>Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}