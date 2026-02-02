'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, MessageCircle, Clock, Shield, TrendingUp, Target, Sparkles, Mail, FileText, Briefcase, Zap, Award, Users, Star, Phone } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function ProApplyPage() {
  const router = useRouter();

  const handleWhatsAppClick = () => {
    const whatsappNumber = '2347056928186';
    const message = encodeURIComponent(
      "Hi! I'm ready to start Pro Apply. What's the next step?"
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const benefits = [
    {
      icon: <Target className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Smart Job Matching",
      description: "We use our in-house matching system to find jobs that fit your skills perfectly"
    },
    {
      icon: <FileText className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "CV Optimization",
      description: "We improve your CV to pass ATS systems and catch recruiters' attention"
    },
    {
      icon: <Zap className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Apply Fast",
      description: "Never miss opportunities again. We apply within hours of job posting"
    },
    {
      icon: <Briefcase className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "We Apply For You",
      description: "Too lazy or busy? We handle all the repetitive application forms"
    },
    {
      icon: <Clock className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Daily Updates",
      description: "Track every application with real-time updates on your WhatsApp"
    },
    {
      icon: <Mail className="w-6 h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Dedicated Email",
      description: "Professional Gmail setup for all your job applications"
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
      features: ["Everything in Professional", "Premium CV Design", "70 Targeted Applications", "Interview Tips"],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Chinedu O.",
      role: "Software Developer",
      text: "I was too lazy to apply consistently. Pro Apply changed everything - 3 interviews in my first week!",
      rating: 5
    },
    {
      name: "Amaka N.",
      role: "Marketing Manager",
      text: "Always applied too late before. Now I get in early and stand out from the crowd.",
      rating: 5
    },
    {
      name: "Tunde K.",
      role: "Financial Analyst",
      text: "My CV wasn't getting noticed. After their optimization, callbacks started coming in.",
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
      <div 
        className="text-white px-4 py-10"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.dark} 100%)` 
        }}
      >
        <div className="max-w-lg mx-auto text-center">
          <div 
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Stop Missing Opportunities</span>
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight">
            Too Lazy to Apply?<br />We Got You.
          </h1>
          <p className="text-base mb-6 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Most people miss jobs because they apply too late or not at all. 
            We find matching jobs fast, optimize your CV, and apply on your behalf.
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mb-3"
            style={{ 
              backgroundColor: theme.colors.primary.DEFAULT,
              boxShadow: `0 10px 25px -5px ${theme.colors.primary.DEFAULT}40`
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Get Started on WhatsApp
          </button>
          <p className="text-xs mt-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Setup in 24 hours • No job guarantees • Just better applications
          </p>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="px-4 py-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-900">The truth:</span> You miss 80% of opportunities because you apply too late. 
            By the time you see a job, hundreds have already applied. We fix that.
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>500+</div>
              <div className="text-xs text-gray-600">Clients Helped</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>24hrs</div>
              <div className="text-xs text-gray-600">First Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>Fast</div>
              <div className="text-xs text-gray-600">Application Speed</div>
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
              { step: "1", title: "Contact us on WhatsApp", desc: "Send us a message to get started and discuss your goals" },
              { step: "2", title: "Create Gmail Account", desc: "Set up a new Gmail address for all your job applications" },
              { step: "3", title: "Send Us Your CV", desc: "Share your CV with us on WhatsApp or complete onboarding on Jobpilot" },
              { step: "4", title: "We Handle Everything", desc: "We find matching jobs using our system, optimize your CV, apply fast, and update you daily" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div 
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                >
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
          <p className="text-center text-gray-600 text-sm mb-6">Affordable help for every job seeker</p>
          
          <div className="space-y-4">
            {packages.map((pkg, i) => (
              <div 
                key={i} 
                className={`relative rounded-xl p-4 border-2 ${pkg.popular ? 'bg-blue-50' : 'bg-white'}`}
                style={{ borderColor: pkg.popular ? theme.colors.primary.DEFAULT : '#E2E8F0' }}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span 
                      className="text-white text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                    >
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
                    <div className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>{pkg.price}</div>
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
                  className="w-full py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{
                    backgroundColor: pkg.popular ? theme.colors.primary.DEFAULT : '#F5F5F5',
                    color: pkg.popular ? '#FFFFFF' : '#1E293B'
                  }}
                >
                  Choose {pkg.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div 
        className="text-white px-4 py-8"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">What Our Clients Say</h2>
          <div className="space-y-4">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{testimonial.role}</div>
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
              { q: "Do you guarantee I'll get a job?", a: "No. We don't guarantee jobs. What we guarantee is faster, optimized applications using our matching system. Getting the job depends on your qualifications and interview performance." },
              { q: "How fast do you apply to new jobs?", a: "We check for new jobs multiple times daily and apply within hours. This gives you an advantage over people who check job boards weekly or monthly." },
              { q: "What if I'm too lazy to even send my CV?", a: "That's exactly why we exist! Message us on WhatsApp, we'll walk you through it step by step. It takes less than 5 minutes." },
              { q: "Can I see which jobs you applied to?", a: "Yes! We send you a daily list on WhatsApp showing every job we applied to on your behalf." },
              { q: "What makes your CV optimization better?", a: "We optimize for ATS (Applicant Tracking Systems) that most companies use. This means your CV actually gets seen by human recruiters instead of being filtered out automatically." }
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
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Ready to Stop Missing Jobs?</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Join 500+ Nigerians who stopped procrastinating and started getting interviews
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mb-3"
            style={{ 
              backgroundColor: theme.colors.primary.DEFAULT,
              color: '#FFFFFF',
              boxShadow: `0 10px 25px -5px ${theme.colors.primary.DEFAULT}40`
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Start on WhatsApp Now
          </button>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              24hr Setup
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              500+ Helped
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            No job guarantees • Just faster, better applications
          </p>
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
