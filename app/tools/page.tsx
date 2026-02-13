"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Building2, Newspaper, Search, Shield, FileCheck, Calculator, Laptop, ChevronDown, MessageCircle, GraduationCap, FileText, Users, Globe } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useRouter } from 'next/navigation';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route?: string;
}

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  items: Tool[];
}

export default function ToolsPage() {
  const router = useRouter();
  const [openAccordion, setOpenAccordion] = useState<string | null>('resources');

  const accordions: AccordionItem[] = [
    {
      id: 'resources',
      title: 'Resources',
      icon: BookOpen,
      color: theme.colors.accent.gold,
      items: [
        {
          id: 'r1',
          title: 'Blogs',
          description: 'Expert insights, salary guides, and career tips',
          icon: Newspaper,
          color: '#9333EA',
          route: '/blog',
        },
        {
          id: 'r2',
          title: 'Resource Pages',
          description: 'Find helpful resources for your job search',
          icon: BookOpen,
          color: theme.colors.accent.gold,
          route: '/resources',
        },
        {
          id: 'r3',
          title: 'Company Pages',
          description: 'Explore top companies, culture, benefits, and open positions',
          icon: Building2,
          color: '#EA580C',
          route: '/company',
        },
      ]
    },
    {
      id: 'career-tools',
      title: 'Career Tools',
      icon: GraduationCap,
      color: theme.colors.accent.blue,
      items: [
        {
          id: 'c1',
          title: 'Interview Practice',
          description: 'Practice with personalized questions based on job descriptions',
          icon: MessageCircle,
          color: '#8B5CF6',
          route: '/tools/interview',
        },
        {
          id: 'c2',
          title: 'ATS CV Review',
          description: 'Optimize your CV for ATS systems and job matching',
          icon: FileCheck,
          color: '#10B981',
          route: '/tools/ats-review',
        },
        {
          id: 'c3',
          title: 'Career Coach',
          description: 'Get personalized career guidance and skill recommendations',
          icon: GraduationCap,
          color: '#F59E0B',
          route: '/tools/career',
        },
        {
          id: 'c4',
          title: 'Role Finder',
          description: 'Discover new career paths based on your skills',
          icon: Search,
          color: '#8B5CF6',
          route: '/tools/role-finder',
        },
        {
          id: 'c5',
          title: 'CV Keyword Checker',
          description: 'Check keyword match between your CV and job descriptions',
          icon: FileText,
          color: '#10B981',
          route: '/tools/keyword-checker',
        },
        {
          id: 'c6',
          title: 'Job Scam Detector',
          description: 'AI-powered analysis to detect job scams in any text',
          icon: Shield,
          color: '#EF4444',
          route: '/tools/scam-detector',
        },
        {
          id: 'c7',
          title: 'Job Scam Checker',
          description: 'Search and report fraudulent companies and recruiters',
          icon: Shield,
          color: '#EF4444',
          route: '/tools/scam-checker',
        },
        {
          id: 'c8',
          title: 'PAYE Calculator',
          description: 'Calculate net salary with 2026 Nigeria tax rates',
          icon: Calculator,
          color: '#3B82F6',
          route: '/tools/paye-calculator',
        },
        {
          id: 'c9',
          title: 'Remote Jobs',
          description: 'Find remote job opportunities in Nigeria and worldwide',
          icon: Laptop,
          color: '#06B6D4',
          route: '/tools/remote-jobs-finder',
        },
      ]
    }
  ];

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleToolClick = (tool: Tool) => {
    if (tool.route) {
      router.push(tool.route);
    }
  };

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        {/* Header */}
        <div
          className="pt-12 pb-8 px-6"
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
          }}
        >
          <div className="flex flex-col gap-2">
            <Link href="/jobs" className="text-sm text-white/80 hover:text-white transition-colors self-start">
              ← Back to Jobs
            </Link>
            <h1
              className="text-2xl font-bold"
              style={{ color: theme.colors.text.light }}
            >
              Career Tools
            </h1>
            <p
              className="text-sm"
              style={{ color: theme.colors.text.light }}
            >
              Smart tools to boost your job search
            </p>
          </div>
        </div>

        {/* Accordions */}
        <div className="px-6 py-6 max-w-3xl mx-auto">
          {accordions.map((accordion) => {
            const AccordionIcon = accordion.icon;
            const isOpen = openAccordion === accordion.id;
            
            return (
              <div key={accordion.id} className="mb-4">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(accordion.id)}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
                  style={{
                    border: `1px solid ${theme.colors.border.DEFAULT}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accordion.color}15` }}
                    >
                      <AccordionIcon size={24} style={{ color: accordion.color }} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-gray-900">{accordion.title}</h2>
                      <p className="text-sm text-gray-500">{accordion.items.length} tools available</p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={24} 
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="mt-3 space-y-3">
                    {accordion.items.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
                          style={{
                            border: `1px solid ${theme.colors.border.DEFAULT}`,
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${tool.color}15` }}
                          >
                            <Icon size={22} style={{ color: tool.color }} />
                          </div>

                          <div className="flex-1 text-left">
                            <h3 className="font-bold text-gray-900">{tool.title}</h3>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                          </div>

                          <ArrowRight
                            size={18}
                            className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
