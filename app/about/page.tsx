"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Users, Globe, Briefcase, TrendingUp, Shield } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function AboutPage() {
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
          <h1 className="text-xl font-bold text-gray-900">About Us</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to JobMeter</h2>
          <p className="text-base text-gray-700 leading-relaxed mb-3">
            JobMeter is a comprehensive online platform designed to connect job seekers with employment opportunities across multiple industries and countries. Our mission is to simplify the job search process, making it easier for candidates to find roles that match their skills, experience, and career goals, while also helping employers reach qualified talent efficiently.
          </p>
          <p className="text-sm text-gray-600 italic">
            Your trusted partner in navigating the global job market
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            Our Mission
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            At JobMeter, our mission is to empower individuals to achieve their career aspirations by providing accessible, efficient, and intelligent job matching services. We believe that finding the right job shouldn't be a daunting task—it should be a seamless experience that connects talent with opportunity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.accent.blue + '20' }}>
                <Users size={24} style={{ color: theme.colors.accent.blue }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">For Job Seekers</h3>
              <p className="text-sm text-gray-600">
                We provide intelligent matching, career tools, and resources to help you find opportunities that align with your skills and goals.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.success + '20' }}>
                <Briefcase size={24} style={{ color: theme.colors.success }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">For Employers</h3>
              <p className="text-sm text-gray-600">
                We connect you with qualified candidates efficiently, helping you build strong teams with the right talent.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            What We Offer
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Job Listings</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Explore job opportunities across a wide range of sectors—from entry-level positions to specialized professional roles. Our platform provides detailed job information, including responsibilities, required skills, salary ranges, and location, empowering you to make informed decisions.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">Smart CV Creation & Analysis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our advanced CV creation tools help you build professional resumes that stand out. We analyze your CV using intelligent algorithms to extract key skills, experience, and qualifications, ensuring better job matches.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">Intelligent Job Matching</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our smart matching technology considers your skills, experience, location preferences, salary expectations, and career goals to recommend positions that truly fit your profile.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">Career Development Tools</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Access interview preparation guides, application tracking, career advice, industry insights, and practical tips to optimize your chances of success and grow professionally.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Whether you're looking for local opportunities or international positions, JobMeter connects you with employers across multiple countries and industries.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose JobMeter */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            Why Choose JobMeter?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 text-center bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary.DEFAULT }}>
                Intuitive
              </div>
              <p className="text-sm text-gray-600">
                User-friendly interface designed for seamless job searching
              </p>
            </div>

            <div className="p-4 text-center bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary.DEFAULT }}>
                Intelligent
              </div>
              <p className="text-sm text-gray-600">
                Advanced algorithms for accurate job matching
              </p>
            </div>

            <div className="p-4 text-center bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary.DEFAULT }}>
                Accessible
              </div>
              <p className="text-sm text-gray-600">
                Connect with opportunities anytime, anywhere
              </p>
            </div>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            Our Commitment
          </h2>
          
          <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              At JobMeter, we are committed to maintaining the highest standards of service quality, data security, and user privacy. We continuously innovate and improve our platform to ensure:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
                <span>Your personal information is protected with industry-leading security measures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
                <span>Job listings are from verified and legitimate employers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
                <span>Our matching algorithms are fair, unbiased, and continuously improving</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
                <span>You receive responsive support whenever you need assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: theme.colors.primary.DEFAULT }}>•</span>
                <span>The platform remains free and accessible to all job seekers</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Who We Serve</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            JobMeter is designed for anyone navigating their career journey:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">Recent Graduates</p>
              <p className="text-xs text-gray-600">Finding your first professional opportunity</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">Career Changers</p>
              <p className="text-xs text-gray-600">Transitioning to new industries or roles</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">Experienced Professionals</p>
              <p className="text-xs text-gray-600">Seeking advancement or new challenges</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">Specialized Talent</p>
              <p className="text-xs text-gray-600">Looking for niche or expert positions</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            We're here to help you succeed in your career journey. If you have questions, feedback, or need support, don't hesitate to reach out:
          </p>
          
          <div className="p-5 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-green-700">Email:</span> help.jobpilot@gmail.com<br />
              <span className="font-semibold text-green-700">WhatsApp:</span> +234 809 299 8662<br />
              <span className="font-semibold text-green-700">Response Time:</span> We aim to respond to all inquiries within 24-48 hours
            </p>
          </div>
        </div>

        {/* Closing Statement */}
        <div className="mt-10 mb-8 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl text-center border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Join Thousands of Job Seekers Finding Success with JobMeter
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Whether you're looking for your first job, switching careers, or seeking specialized positions, JobMeter is your trusted partner in navigating the global job market. Start your journey today and discover opportunities that match your potential.
          </p>
        </div>
      </div>
    </div>
  );
}