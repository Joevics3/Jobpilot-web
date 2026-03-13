import { Metadata } from 'next';
import ObjectiveQuizClient from './ObjectiveQuizClient';
import { quizSupabase } from '@/lib/quizSupabase';

interface Props {
  params: Promise<{ company: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company: companySlug } = await params;
  const company = companySlug.replace(/-/g, ' ').toUpperCase();
  
  return {
    title: `${company} Objective Questions Quiz | Practice Online`,
    description: `Free ${company} objective aptitude test questions. Multiple choice quiz with ${company} recruitment test practice.`,
    keywords: [`${company} objective questions`, `${company} aptitude test`, 'multiple choice quiz'],
  };
}

export default async function ObjectiveQuizPage({ params }: Props) {
  const { company: companySlug } = await params;
  const company = companySlug.replace(/-/g, ' ').toUpperCase();
  
  return <ObjectiveQuizClient company={company} />;
}
