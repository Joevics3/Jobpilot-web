'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, MessageCircle, Clock, Shield, TrendingUp, Target, Sparkles, Mail, FileText, Briefcase, Zap, Award, Star } from 'lucide-react';
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
      icon: <Target className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Smart Job Matching",
      description: "We use our in-house matching system to find jobs that fit your skills perfectly"
    },
    {
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "CV Optimization",
      description: "We improve your CV to pass ATS systems and catch recruiters' attention"
    },
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Apply Fast",
      description: "Never miss opportunities again. We apply within hours of job posting"
    },
    {
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "We Apply For You",
      description: "Too lazy or busy? We handle all the repetitive application forms"
    },
    {
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
      title: "Daily Updates",
      description: "Track every application with real-time updates on your WhatsApp"
    },
    {
      icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.primary.DEFAULT }} />,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
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
        className="text-white px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.dark} 100%)` 
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Stop Missing Opportunities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
            Too Busy or Lazy to Apply?<br className="hidden sm:block" /> We Got You.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Most people miss jobs because they apply too late or not at all. 
            We find matching jobs fast, optimize your CV, and apply on your behalf.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <button
              onClick={handleWhatsAppClick}
              className="font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{ 
                backgroundColor: theme.colors.primary.DEFAULT,
                boxShadow: `0 10px 25px -5px ${theme.colors.primary.DEFAULT}40`
              }}
            >
              <MessageCircle className="w-5 h-5" />
              Get Started on WhatsApp
            </button>
          </div>
          <p className="text-xs sm:text-sm mt-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Setup in 24 hours • No job guarantees • Just better applications
          </p>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-900">The truth:</span> You miss 80% of opportunities because you apply too late. 
            By the time you see a job, hundreds have already applied. We fix that.
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>500+</div>
              <div className="text-xs sm:text-sm text-gray-600">Clients Helped</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>24hrs</div>
              <div className="text-xs sm:text-sm text-gray-600">First Applications</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>Fast</div>
              <div className="text-xs sm:text-sm text-gray-600">Application Speed</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - 4 Simple Steps */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">Get Started in 4 Simple Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "1", title: "Contact us on WhatsApp", desc: "Send us a message to get started" },
              { step: "2", title: "Create Gmail Account", desc: "Set up a new Gmail for job applications" },
              { step: "3", title: "Send Us Your CV", desc: "Share your CV on WhatsApp or Jobpilot" },
              { step: "4", title: "We Handle Everything", desc: "We find jobs, optimize CV, apply & update you" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center font-bold text-base sm:text-lg mx-auto mb-3"
                  style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">What You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
                <div className="mb-2 sm:mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">Choose Your Plan</h2>
          <p className="text-center text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">Affordable help for every job seeker</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {packages.map((pkg, i) => (
              <div 
                key={i} 
                className={`relative rounded-xl p-4 sm:p-6 border-2 ${pkg.popular ? 'bg-blue-50' : 'bg-white'}`}
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
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900">{pkg.name}</h3>
                  <div className="text-2xl sm:text-3xl font-bold mt-2" style={{ color: theme.colors.primary.DEFAULT }}>{pkg.price}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{pkg.period}</div>
                </div>
                <p className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{pkg.jobs} • {pkg.frequency}</p>
                <ul className="space-y-2 mb-4 sm:mb-6">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
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
        className="text-white px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 sm:p-6">
                <div className="flex gap-1 mb-2 sm:mb-3">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">Common Questions</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { q: "Do you guarantee I'll get a job?", a: "No. We don't guarantee jobs. What we guarantee is faster, optimized applications using our matching system. Getting the job depends on your qualifications and interview performance." },
              { q: "How fast do you apply to new jobs?", a: "We check for new jobs multiple times daily and apply within hours. This gives you an advantage over people who check job boards weekly or monthly." },
              { q: "What if I'm too lazy to even send my CV?", a: "That's exactly why we exist! Message us on WhatsApp, we'll walk you through it step by step. It takes less than 5 minutes." },
              { q: "Can I see which jobs you applied to?", a: "Yes! We send you a daily list on WhatsApp showing every job we applied to on your behalf." },
              { q: "What makes your CV optimization better?", a: "We optimize for ATS (Applicant Tracking Systems) that most companies use. This means your CV actually gets seen by human recruiters instead of being filtered out automatically." }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Ready to Stop Missing Jobs?</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
            Join 500+ Nigerians who stopped procrastinating and started getting interviews
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleWhatsAppClick}
              className="font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{ 
                backgroundColor: theme.colors.primary.DEFAULT,
                color: '#FFFFFF',
                boxShadow: `0 10px 25px -5px ${theme.colors.primary.DEFAULT}40`
              }}
            >
              <MessageCircle className="w-5 h-5" />
              Start on WhatsApp Now
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 mt-6">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              24hr Setup
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              500+ Helped
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            No job guarantees • Just faster, better applications
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm">
        <div className="max-w-4xl mx-auto">
          <p className="mb-2">Pro Apply - Professional CV Distribution Service</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
