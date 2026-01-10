"use client";

import React, { useState } from 'react';
import { MessageCircle, FileCheck, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import InterviewPrepModal from '@/components/tools/InterviewPrepModal';
import CareerCoachModal from '@/components/tools/CareerCoachModal';
import BannerAd from '@/components/ads/BannerAd';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  modal?: 'interview' | 'career';
  route?: string;
}

export default function ToolsPage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'interview' | 'ats' | 'career' | null>(null);

  const tools: Tool[] = [
    {
      id: '1',
      title: 'Resources & Blog',
      description: 'Career advice, job search tips, and professional development resources',
      icon: BookOpen,
      color: theme.colors.accent.gold,
      route: '/resources',
    },
    {
      id: '2',
      title: 'ATS CV Review',
      description: 'Optimize your CV for ATS systems and job matching',
      icon: FileCheck,
      color: theme.colors.accent.green,
      route: '/tools/ats-review',
    },
    {
      id: '3',
      title: 'Career Coach',
      description: 'Get personalized career guidance and skill recommendations',
      icon: GraduationCap,
      color: theme.colors.accent.blue,
      modal: 'career',
    },
    {
      id: '4',
      title: 'Interview Prep',
      description: 'Practice with personalized questions based on job descriptions',
      icon: MessageCircle,
      color: theme.colors.accent.blue,
      route: '/tools/interview',
    },
  ];

  const handleToolClick = (tool: Tool) => {
    if (tool.route) {
      router.push(tool.route);
    } else if (tool.modal) {
      setActiveModal(tool.modal);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
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

        {/* Top Banner Ad - Before Interview Prep */}
        <div className="px-6">
          <BannerAd />
        </div>

        {/* Tools Grid */}
        <div className="px-6 py-6">
          <div className="flex flex-col gap-4">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <React.Fragment key={tool.id}>
                <button
                  onClick={() => handleToolClick(tool)}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
                  style={{
                    border: `1px solid ${theme.colors.border.DEFAULT}`,
                  }}
                >
                  {/* Icon Container */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${tool.color}15` }}
                  >
                    <Icon size={28} style={{ color: tool.color }} />
                  </div>

                  {/* Tool Info */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                  />
                </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'interview' && (
        <InterviewPrepModal isOpen={true} onClose={handleCloseModal} />
      )}
      {activeModal === 'career' && (
        <CareerCoachModal isOpen={true} onClose={handleCloseModal} />
      )}
    </>
  );
}





