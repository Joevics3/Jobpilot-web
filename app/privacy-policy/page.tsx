"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, UserCheck } from 'lucide-react';
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
        {/* Last Updated */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Last Updated:</span> January 28, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Our Commitment to Your Privacy</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            At JobMeter, we are committed to protecting your personal information and respecting your privacy. 
            This Privacy Policy explains how we collect, use, store, and protect your information when you use our 
            job search platform and related services.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Full name, email address, and phone number</li>
                <li>Professional information (CV, work experience, skills)</li>
                <li>Education and qualification details</li>
                <li>Location preferences and work authorization</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Pages visited and time spent on our platform</li>
                <li>Job searches and applications submitted</li>
                <li>Device information and IP address</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Communication Data</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Messages sent to employers or support</li>
                <li>Email communications and responses</li>
                <li>Customer support interactions</li>
                <li>Feedback and survey responses</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">How We Use Your Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Core Services</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create and manage your profile</li>
                <li>• Match you with relevant jobs</li>
                <li>• Process job applications</li>
                <li>• Provide career tools and insights</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h3 className="font-semibold text-green-800 mb-2">Platform Improvement</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Enhance user experience</li>
                <li>• Develop new features</li>
                <li>• Analyze platform usage</li>
                <li>• Prevent fraudulent activities</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-2">Communication</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Send job recommendations</li>
                <li>• Provide support responses</li>
                <li>• Share platform updates</li>
                <li>• Send important notifications</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <h3 className="font-semibold text-orange-800 mb-2">Legal Compliance</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Meet legal obligations</li>
                <li>• Protect user safety</li>
                <li>• Enforce our terms</li>
                <li>• Respond to legal requests</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Information Sharing */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Information Sharing & Disclosure</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">With Your Consent</h3>
              <p className="text-sm text-gray-600">
                We share your information with employers only when you explicitly apply for their positions 
                or when you choose to make your profile visible to recruiters.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Service Providers</h3>
              <p className="text-sm text-gray-600 mb-3">
                We work with trusted third-party services for hosting, analytics, communication, and advertising. 
                These providers are contractually bound to protect your information.
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Key Partners:</span> Ezoic Inc. (advertising services), Supabase (database hosting), 
                Google Analytics (website analytics), and other communication/service providers.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Legal Requirements</h3>
              <p className="text-sm text-gray-600">
                We may disclose information when required by law, court order, or to protect our rights, 
                property, or safety, or that of our users or the public.
              </p>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Data Security & Protection</h2>
          </div>
          
          <div className="p-5 bg-green-50 rounded-xl border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Our Security Measures Include:</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">✓</span>
                <span>SSL encryption for all data transmissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">✓</span>
                <span>Secure data centers with restricted access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">✓</span>
                <span>Regular security audits and penetration testing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">✓</span>
                <span>Employee background checks and training</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">✓</span>
                <span>Compliance with international data protection laws</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Your Rights */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Your Privacy Rights</h2>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">Access & Correction</h4>
              <p className="text-sm text-gray-600">You can access, update, or correct your personal information at any time through your account settings.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">Data Deletion</h4>
              <p className="text-sm text-gray-600">You can request deletion of your account and personal data, subject to legal retention requirements.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">Marketing Preferences</h4>
              <p className="text-sm text-gray-600">You can opt out of marketing communications while maintaining access to essential platform services.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">Data Portability</h4>
              <p className="text-sm text-gray-600">You can request a copy of your personal data in a machine-readable format.</p>
            </div>
          </div>
        </div>

        {/* Ezoic Services */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-bold text-gray-900">Ezoic Advertising Services</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Third-Party Advertising Management</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                This website uses the services of Ezoic Inc. ("Ezoic"), including to manage third-party interest-based advertising. 
                Ezoic may employ a variety of technologies on this website, including tools to serve content, display advertisements 
                and enable advertising to visitors of this website, which may utilize first and third-party cookies.
              </p>
              <div id="ezoic-privacy-policy-embed"></div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">Cookie Information</h3>
              <p className="text-sm text-orange-700 leading-relaxed mb-3">
                A cookie is a small text file sent to your device by a web server that enables the website to remember information 
                about your browsing activity. First-party cookies are created by the site you're visiting, while third-party cookies 
                are set by domains other than the one you're visiting.
              </p>
              <p className="text-sm text-orange-700 leading-relaxed mb-3">
                Ezoic and our partners may place third-party cookies, tags, beacons, pixels, and similar technologies to monitor 
                interactions with advertisements and optimize ad targeting. Please note that disabling cookies may limit access to 
                certain content and features on the website, and rejecting cookies does not eliminate advertisements but will 
                result in non-personalized advertising.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Data Collected for Personalized Advertising</h3>
              <p className="text-sm text-blue-700 leading-relaxed mb-3">
                The following information may be collected, used, and stored in a cookie when serving personalized ads:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside mb-3">
                <li>IP address</li>
                <li>Operating system type and version</li>
                <li>Device type</li>
                <li>Language preferences</li>
                <li>Web browser type</li>
                <li>Email (in a hashed or encrypted form)</li>
              </ul>
              <p className="text-sm text-blue-700 leading-relaxed">
                Ezoic and its partners may use this data in combination with information that has been independently collected 
                to deliver targeted advertisements across various platforms and websites. Ezoic's partners may also gather 
                additional data, such as unique IDs, advertising IDs, geolocation data, usage data, device information, traffic 
                data, referral sources, and interactions between users and websites or advertisements, to create audience segments 
                for targeted advertising across different devices, browsers, and apps.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Ezoic Privacy & Partner Information</h3>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600">•</span>
                  <span>You can view Ezoic's privacy policy <a href="https://www.ezoic.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">here</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600">•</span>
                  <span>For additional information about Ezoic's advertising and other partners, you can view Ezoic's advertising partners <a href="https://www.ezoic.com/advertising-partners/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">here</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600">•</span>
                  <span>You can find more information about interest-based advertising and how to manage them <a href="https://www.ezoic.com/interest-based-ads/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">here</a></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cookies Policy */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cookies & Tracking Technologies</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            We use cookies and similar technologies to enhance your experience, analyze traffic, and personalize content. 
            This includes both first-party cookies for essential platform functionality and third-party cookies through 
            our advertising partners like Ezoic for personalized advertising. You can control cookie settings through your 
            browser preferences.
          </p>
          
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> Disabling certain cookies may affect some features and functionality of our platform, 
              including the delivery of personalized advertisements.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us About Privacy</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, 
            please contact our Data Protection Officer:
          </p>
          
          <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-700">Email:</span> help.jobmeter@gmail.com<br />
              <span className="font-semibold text-blue-700">WhatsApp:</span> +234 705 692 8186<br />
              <span className="font-semibold text-blue-700">Response Time:</span> We respond to privacy inquiries within 30 days
            </p>
          </div>
        </div>

        {/* Policy Updates */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Policy Updates</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices, 
            applicable laws, or our operations. We will notify you of significant changes by:
          </p>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
              <span>Posting the updated policy on our platform</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
              <span>Sending email notifications for material changes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
              <span>Displaying prominent notices on our platform</span>
            </li>
          </ul>
        </div>

        {/* Bottom note */}
        <div className="mt-10 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl text-center border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Your Privacy Matters to Us
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            We are committed to protecting your privacy and earning your trust every day. 
            By using JobMeter, you agree to the collection and use of information as described in this policy.
          </p>
        </div>
      </div>
    </div>
  );
}