// 📁 app/tools/quiz/[company]/page.tsx
// Pre-rendered at build time for every company in COMPANIES.
// Supabase is called ONCE per company at build time for SEO content — never on user visit.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompanyQuizClient from './CompanyQuizClient';
import { COMPANIES, companyToSlug, slugToCompany } from '@/lib/quizCompanies';
import { quizSupabase } from '@/lib/quizSupabase';

// Cache SEO content for 7 days — rebuild weekly or on redeploy
export const revalidate = 604800;

interface Props {
  params: Promise<{ company: string }>;
}

interface CompanyData {
  id?: string;
  name?: string;
  description?: string;
}

// ── Fetch company SEO data from quiz_companies table ─────────────────────────
// Called at build time only — result is baked into static HTML
async function getCompanyData(companyName: string): Promise<CompanyData | null> {
  try {
    const { data } = await quizSupabase
      .from('quiz_companies')
      .select('*')
      .ilike('name', companyName)
      .single();
    return data;
  } catch {
    return null;
  }
}

// ── Pre-render every company page at build time ───────────────────────────────
export async function generateStaticParams() {
  return COMPANIES.map((company) => ({
    company: companyToSlug(company),
  }));
}

// ── SEO metadata — uses quiz_companies description if available ───────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company: slug } = await params;
  const company = slugToCompany(slug);
  if (!company) return {};

  const companyData = await getCompanyData(company);
  const firstName = company.split(' ')[0];

  const description = companyData?.description
    ? companyData.description.replace(/<[^>]+>/g, '').slice(0, 160) // strip HTML, limit length
    : `Practice ${company} aptitude test questions online. Free objective questions with instant results. Premium: 50 questions + AI-graded theory. Prepare for ${firstName} recruitment.`;

  return {
    title: `${company} | Practice Questions & Answers`,
    description,
    keywords: [
      `${firstName} aptitude test`,
      `${firstName} recruitment test`,
      `${company} practice questions`,
      `${firstName} past questions`,
      'aptitude test Nigeria',
      'recruitment assessment practice',
    ],
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function CompanyQuizPage({ params }: Props) {
  const { company: slug } = await params;
  const company = slugToCompany(slug);

  if (!company) notFound();

  // Fetch SEO content at build time — passed as static prop to client component
  const companyData = await getCompanyData(company!);

  return <CompanyQuizClient company={company!} companyData={companyData} />;
}