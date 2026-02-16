"use client";

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  FileCheck, 
  Search, 
  Shield, 
  Calculator, 
  Laptop, 
  MessageCircle, 
  GraduationCap,
  ArrowRight,
  Briefcase
} from 'lucide-react';
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

interface ToolCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  tools: Tool[];
}

export default function ToolsPage() {
  const router = useRouter();

  const categories: ToolCategory[] = [
    {
      id: 'cv-tools',
      title: 'CV Tools',
      description: 'Build and optimize your CV',
      icon: FileText,
      color: '#2563EB',
      tools: [
        {
          id: 'cv-create',
          title: 'Create CV/Cover Letter',
          description: 'Build professional CVs and cover letters in minutes',
          icon: FileText,
          color: '#2563EB',
          route: '/cv',
        },
        {
          id: 'keyword-checker',
          title: 'CV Keyword Checker',
          description: 'Check keyword match between your CV and job descriptions',
          icon: Search,
          color: '#10B981',
          route: '/tools/keyword-checker',
        },
        {
          id: 'ats-review',
          title: 'ATS CV Review',
          description: 'Optimize your CV for ATS systems and job matching',
          icon: FileCheck,
          color: '#8B5CF6',
          route: '/tools/ats-review',
        },
      ],
    },
    {
      id: 'career-tools',
      title: 'Career Tools',
      description: 'Tools to help advance your career',
      icon: Briefcase,
      color: '#F59E0B',
      tools: [
        {
          id: 'interview',
          title: 'Interview Practice',
          description: 'Practice with personalized questions based on job descriptions',
          icon: MessageCircle,
          color: '#8B5CF6',
          route: '/tools/interview',
        },
        {
          id: 'career',
          title: 'Career Coach',
          description: 'Get personalized career guidance and advice',
          icon: GraduationCap,
          color: '#F59E0B',
          route: '/tools/career',
        },
        {
          id: 'role-finder',
          title: 'Role Finder',
          description: 'Discover new career paths based on your skills',
          icon: Search,
          color: '#06B6D4',
          route: '/tools/role-finder',
        },
      ],
    },
    {
      id: 'safety-tools',
      title: 'Safety Tools',
      description: 'Stay safe from job scams',
      icon: Shield,
      color: '#EF4444',
      tools: [
        {
          id: 'scam-detector',
          title: 'Job Description Analyzer',
          description: 'AI-powered analysis to detect job scams in any text',
          icon: Shield,
          color: '#EF4444',
          route: '/tools/scam-detector',
        },
        {
          id: 'scam-checker',
          title: 'Job Scam Checker',
          description: 'Search and report fraudulent companies and recruiters',
          icon: Shield,
          color: '#DC2626',
          route: '/tools/scam-checker',
        },
      ],
    },
    {
      id: 'salary-tools',
      title: 'Salary Tools',
      description: 'Calculate and compare salaries',
      icon: Calculator,
      color: '#3B82F6',
      tools: [
        {
          id: 'paye-calculator',
          title: 'PAYE Calculator',
          description: 'Calculate net salary with 2026 Nigeria tax rates',
          icon: Calculator,
          color: '#3B82F6',
          route: '/tools/paye-calculator',
        },
      ],
    },
  ];

  const handleToolClick = (tool: Tool) => {
    if (tool.route) {
      router.push(tool.route);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header - Hero Section */}
      <div
        className="pt-12 pb-10 px-6"
        style={{
          backgroundColor: theme.colors.primary.DEFAULT,
        }}
      >
        <div className="max-w-4xl mx-auto">
            <h1
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: theme.colors.text.light }}
            >
              Career Tools
            </h1>
        </div>
      </div>

      {/* Tools Categories */}
      <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            
            return (
              <section key={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <CategoryIcon size={24} style={{ color: category.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{category.title}</h2>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => {
                    const Icon = tool.icon;
                    
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool)}
                        className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex items-start gap-4 text-left group"
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

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{tool.description}</p>
                        </div>

                        <ArrowRight
                          size={18}
                          className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}