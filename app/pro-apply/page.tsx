'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, MessageCircle, Clock, Shield, TrendingUp, Target, Sparkles, Mail, FileText, Briefcase, Zap, Award, Users, Star, Phone } from 'lucide-react';

export default function ProApplyPage() {
  const router = useRouter();

  const handleWhatsAppClick = () => {
    const whatsappNumber = '2347056928186';
    const message = encodeURIComponent(
      "Hi! I'm ready to start Pro Apply. What's the next step for payment?"
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const benefits = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "Smart Job Matching",
      description: "We analyze your profile and target only the jobs that match your skills, experience, and career goals"
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: "Professional CV & Cover Letter",
      description: "Expert-written CV and cover letter tailored specifically for your industry and target roles"
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Dedicated Email Setup",
      description: "Professional email address created just for your job applications to keep everything organized"
    },
    {
      icon: <Briefcase className="w-6 h-6 text-blue-600" />,
      title: "We Apply For You",
      description: "Our team submits applications on your behalf to save you hours of repetitive form filling"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: "Daily Progress Updates",
      description: "Track every application with real-time updates sent directly to your WhatsApp"
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Fast Results",
      description: "Get setup within 24 hours and start seeing interview invitations within days, not weeks"
    }
  ];

  const packages = [
    {
      name: "Starter",
      price: "₦3,000",
      period: "per month",
      jobs: "15 Jobs",
      frequency: "1 Job Every 2 Days",
      features: ["Profile Analysis", "CV Optimization", "15 Targeted Applications", "Daily Updates"],
      popular: false
    },
    {
      name: "Professional",
      price: "₦5,000",
      period: "per month",
      jobs: "30 Jobs",
      frequency: "1 Job Daily",
      features: ["Everything in Starter", "Cover Letter Writing", "30 Targeted Applications", "Priority Support"],
      popular: true
    },
    {
      name: "Executive",
      price: "₦10,000",
      period: "per month",
      jobs: "70 Jobs",
      frequency: "2-3 Jobs Daily",
      features: ["Everything in Professional", "Premium CV Design", "70 Targeted Applications", "Interview Coaching Tips"],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Chinedu O.",
      role: "Software Developer",
      text: "Got 3 interviews in my first week! This service is a game changer for job seekers.",
      rating: 5
    },
    {
      name: "Amaka N.",
      role: "Marketing Manager",
      text: "Worth every naira. They found jobs I never would have found on my own.",
      rating: 5
    },
    {
      name: "Tunde K.",
      role: "Financial Analyst",
      text: "Finally landed my dream job at a top bank. Pro Apply made it happen!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-semibold text-gray-900">Pro Apply</span>
          <div className="w-9" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 py-10">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Nigeria's #1 Job Application Service</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight">
            Stop Applying.<br />Start Getting Hired.
          </h1>
          <p className="text-blue-100 text-base mb-6 leading-relaxed">
            We find jobs matching your profile, create professional CVs, and apply on your behalf. 
            You just show up for interviews.
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30"
          >
            <MessageCircle className="w-5 h-5" />
            Get Started on WhatsApp
          </button>
          <p className="text-blue-200 text-xs mt-3">Setup completed within 24 hours</p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 px-4 py-6 border-b border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-xs text-gray-600">Jobs Secured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">2,000+</div>
              <div className="text-xs text-gray-600">Happy Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">48hrs</div>
              <div className="text-xs text-gray-600">Avg. First Interview</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - 4 Simple Steps */}
      <div className="px-4 py-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Get Started in 4 Simple Steps</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Make Payment", desc: "Choose your package and make payment to activate your account" },
              { step: "2", title: "Create Gmail Account", desc: "Set up a new Gmail address for all your job applications" },
              { step: "3", title: "Send Us Your CV", desc: "Share your CV with us on WhatsApp or complete onboarding on Jobpilot" },
              { step: "4", title: "We Handle Everything", desc: "We find matching jobs, optimize your CV, apply for you, and send daily updates" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="bg-gray-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">What You Get</h2>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
                <div className="mb-2">{benefit.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="px-4 py-8" id="pricing">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-2 text-gray-900">Choose Your Plan</h2>
          <p className="text-center text-gray-600 text-sm mb-6">Affordable packages for every job seeker</p>
          
          <div className="space-y-4">
            {packages.map((pkg, i) => (
              <div 
                key={i} 
                className={`relative rounded-xl p-4 border-2 ${pkg.popular ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-600">{pkg.jobs} • {pkg.frequency}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{pkg.price}</div>
                    <div className="text-xs text-gray-500">{pkg.period}</div>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleWhatsAppClick}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                    pkg.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Choose {pkg.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-blue-600 text-white px-4 py-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Success Stories</h2>
          <div className="space-y-4">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-blue-50 mb-3 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-blue-200">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 py-8 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "How quickly will I get my first interview?", a: "Most clients receive their first interview invitation within 48-72 hours of starting the service." },
              { q: "What types of jobs do you apply for?", a: "We target jobs that match your skills, experience level, and career goals across all industries." },
              { q: "Can I see the jobs before you apply?", a: "Yes! We send you daily updates on WhatsApp showing every job we've applied to on your behalf." },
              { q: "What if I'm not satisfied?", a: "We offer a 7-day money-back guarantee if you're not happy with the service." }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-4 py-8 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Ready to Land Your Dream Job?</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Join 2,000+ Nigerians who've landed better jobs faster with Pro Apply
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 mb-3"
          >
            <MessageCircle className="w-5 h-5" />
            Start on WhatsApp Now
          </button>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              7-Day Guarantee
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              24hr Setup
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              500+ Hired
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 px-4 py-6 text-center text-xs">
        <div className="max-w-lg mx-auto">
          <p className="mb-2">Pro Apply - Professional CV Distribution Service</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
