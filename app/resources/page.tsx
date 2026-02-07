import { Metadata } from 'next';
import ResourcesPageClient from '@/components/resources/ResourcesPageClient';

export const metadata: Metadata = {
  title: 'Browse Jobs by Category | JobMeter',
  description: 'Explore job opportunities across different categories and locations in Nigeria. Find accountant jobs, tech jobs, healthcare jobs, and more.',
  keywords: ['job categories', 'job search', 'careers', 'employment', 'Nigeria jobs'],
  openGraph: {
    title: 'Browse Jobs by Category | JobMeter',
    description: 'Explore job opportunities across different categories and locations in Nigeria.',
    type: 'website',
  },
};

export default function ResourcesPage() {
  return <ResourcesPageClient />;
}