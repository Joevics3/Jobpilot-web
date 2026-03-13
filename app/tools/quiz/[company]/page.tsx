// 📁 app/tools/quiz/[company]/page.tsx
import { Metadata } from 'next';
import { quizSupabase } from '@/lib/quizSupabase';
import CompanyQuizClient from './CompanyQuizClient';

interface Props {
  params: Promise<{ company: string }>;
}

export const revalidate = 604800; // Revalidate every week

async function getCompanyData(companyName: string) {
  const { data } = await quizSupabase
    .from('quiz_companies')
    .select('*')
    .ilike('name', companyName)
    .single();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company: companySlug } = await params;
  const company = companySlug.replace(/-/g, ' ').toUpperCase();

  const companyData = await getCompanyData(company);
  const description =
    companyData?.description ||
    `Practice ${company} aptitude test questions online. Free objective and theory questions with instant results. Prepare for ${company} recruitment.`;

  return {
    title: `${company} Aptitude Test Quiz | Practice Online`,
    description,
    keywords: [
      `${company} aptitude test`,
      `${company} quiz`,
      `${company} recruitment test`,
      'aptitude test practice',
      'job interview preparation',
    ],
  };
}

export default async function CompanyQuizPage({ params }: Props) {
  const { company: companySlug } = await params;
  const company = companySlug.replace(/-/g, ' ').toUpperCase();

  const companyData = await getCompanyData(company);

  return <CompanyQuizClient company={company} companyData={companyData} />;
}