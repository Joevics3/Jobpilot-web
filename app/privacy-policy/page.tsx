"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 pt-12">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="mb-8 p-5 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: theme.colors.success }}>
          <p className="text-base text-gray-700 leading-relaxed mb-4">
            At JobPilot, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our smart job matching platform.
          </p>
          <p className="text-sm text-gray-600 italic">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 mb-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">1.1 Personal Information</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Create an account and complete your profile</li>
              <li>Upload your CV or resume</li>
              <li>Fill out job preferences and career goals</li>
              <li>Contact us for support or inquiries</li>
              <li>Participate in surveys or feedback forms</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              This information may include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Full name, email address, and phone number</li>
              <li>Professional title, work experience, and skills</li>
              <li>Educational background and certifications</li>
              <li>Location preferences and salary expectations</li>
              <li>Career objectives and job search preferences</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">1.2 Automatically Collected Information</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              When you use our platform, we automatically collect certain information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>IP address and general location information</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log files and analytics data</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">1.3 Third-Party Information</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may receive information about you from third parties, such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Social media platforms (if you choose to connect your accounts)</li>
              <li>Professional networking sites (LinkedIn, GitHub, etc.)</li>
              <li>Job boards and recruitment platforms</li>
              <li>Analytics and marketing partners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">2.1 Core Service Delivery</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We use your information to provide and improve our job matching services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Analyze your CV and professional background</li>
              <li>Match you with relevant job opportunities based on your skills and preferences</li>
              <li>Provide personalized career recommendations and insights</li>
              <li>Send you job alerts and notifications about new opportunities</li>
              <li>Facilitate communication between you and potential employers</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">2.2 Platform Improvement</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We use aggregated and anonymized data to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Improve our matching accuracy and platform features</li>
              <li>Analyze market trends and job demand patterns</li>
              <li>Develop new features and enhance user experience</li>
              <li>Conduct research and analytics to better serve our users</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">2.3 Communication</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may use your contact information to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Send you important updates about our services</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Notify you about changes to our terms or privacy policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.1 With Employers and Recruiters</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may share your information with potential employers and recruiters when:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>You apply for a job through our platform</li>
              <li>Your profile matches their job requirements</li>
              <li>You explicitly consent to sharing your information</li>
              <li>You participate in recruitment events or job fairs</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.2 Service Providers</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may share your information with trusted third-party service providers who assist us in:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Cloud hosting and data storage (Supabase, AWS)</li>
              <li>Data processing and analytics services</li>
              <li>Email and communication services</li>
              <li>Analytics and performance monitoring</li>
              <li>Payment processing (if applicable)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.3 Legal Requirements</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may disclose your information if required to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or illegal activities</li>
              <li>Respond to government requests or investigations</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.4 Business Transfers</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security and Protection</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">4.1 Security Measures</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We implement comprehensive security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure cloud storage with industry-standard encryption</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication protocols</li>
              <li>Employee training on data protection best practices</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">4.2 Data Retention</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Improve our services and algorithms</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">5.1 Access and Control</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">5.2 Privacy Settings</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              You can control your privacy preferences through your account settings:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Manage your profile visibility</li>
              <li>Control job matching notifications</li>
              <li>Adjust data sharing preferences</li>
              <li>Set communication preferences</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">5.3 Data Portability</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              You can request a copy of your personal data in a structured, machine-readable format. This includes your profile information, job preferences, and application history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. International Data Transfers</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              JobPilot operates globally, and your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Standard contractual clauses approved by relevant authorities</li>
              <li>Adequacy decisions by data protection authorities</li>
              <li>Binding corporate rules and certification schemes</li>
              <li>Other legally recognized transfer mechanisms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              JobPilot is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            
            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">8.1 Types of Cookies</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We use various types of cookies and similar technologies:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Essential cookies: Required for basic platform functionality</li>
              <li>Performance cookies: Help us understand how users interact with our platform</li>
              <li>Functional cookies: Remember your preferences and settings</li>
              <li>Marketing cookies: Used for targeted advertising and analytics</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">8.2 Cookie Management</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-3 ml-4">
              <li>Posting the updated policy on our platform</li>
              <li>Sending you an email notification</li>
              <li>Displaying a prominent notice on our platform</li>
              <li>Updating the "Last updated" date at the top of this policy</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Your continued use of our platform after any changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-green-700">Email:</span> help.jobpilot@gmail.com<br />
                <span className="font-semibold text-green-700">WhatsApp:</span> +234 809 299 8662<br />
                <span className="font-semibold text-green-700">Response Time:</span> We aim to respond to all inquiries within 24-48 hours
              </p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              For data protection inquiries, you can also contact our Data Protection Officer at the email address above.
            </p>
          </section>
        </div>

        <div className="mt-10 mb-8 p-5 bg-gray-50 rounded-xl text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the JobPilot platform.
          </p>
        </div>
      </div>
    </div>
  );
}



