import JobList from '@/components/jobs/JobList';
import { Metadata } from 'next';
import { BreadcrumbListSchema } from '@/components/seo/StructuredData';

export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

export const metadata: Metadata = {
  title: 'Jobs in UAE - Find Employment Opportunities | JobMeter',
  description: 'Browse latest job openings in UAE. Find full-time, part-time, and remote jobs across all industries. Apply to top UAE companies today.',
  alternates: {
    canonical: `${siteUrl}/jobs/uae`,
    languages: {
      'en-AE': `${siteUrl}/jobs/uae`,
      'en': `${siteUrl}/jobs/uae`,
    },
  },
};

export default function UAEJobsPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteUrl },
    { name: 'Jobs', url: `${siteUrl}/jobs` },
    { name: 'UAE', url: `${siteUrl}/jobs/uae` },
  ];

  return (
    <>
      <BreadcrumbListSchema items={breadcrumbItems} />

      <JobList initialCountry="United Arab Emirates" />


      {/* SEO Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Finding Jobs in the United Arab Emirates</h2>
      <p className="text-gray-600 mb-4">The United Arab Emirates is one of the world's most dynamic employment destinations, attracting skilled professionals from over 190 countries. With a largely tax-free income structure, world-class infrastructure, and ambitious economic diversification under Vision 2030 and Vision 2071, the UAE offers exceptional career opportunities across virtually every industry. JobMeter aggregates <strong>current job vacancies in the UAE</strong> from verified employers in Dubai, Abu Dhabi, Sharjah, and beyond, updated throughout the day.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Top Industries Hiring in the UAE</h3>
      <p className="text-gray-600 mb-4">Construction and real estate continue to drive enormous hiring volumes, fuelled by mega-projects like Dubai Creek Harbour, Yas Island expansion, and NEOM-linked supply chains. Financial services — including banking, insurance, asset management, and the fast-growing fintech sector — account for a significant share of professional roles in Dubai's DIFC and Abu Dhabi's ADGM financial centres. Tourism and hospitality remain central to the UAE economy, with the country hosting over 25 million visitors annually and the world's most recognised luxury hotel brands maintaining large operations here. Technology, healthcare, logistics, and renewable energy are the fastest-growing sectors for new <strong>jobs in Dubai and Abu Dhabi</strong>.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Dubai vs Abu Dhabi: Where to Find Work</h3>
      <p className="text-gray-600 mb-4">Dubai is the UAE's commercial capital and the largest job market, home to the regional headquarters of thousands of multinational corporations. It leads in retail, tourism, logistics, marketing, technology, and financial services. <strong>Jobs in Dubai</strong> are the most searched category for UAE-bound professionals. Abu Dhabi, the political capital, offers the highest concentration of government, energy, and sovereign wealth-related roles — ADNOC, Mubadala, and ADQ are among the biggest employers. Sharjah and Ajman offer more affordable living with reasonable commuting distance to Dubai.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">UAE Work Visas and Sponsorship</h3>
      <p className="text-gray-600 mb-4">All expatriate workers in the UAE require a valid employment visa sponsored by their employer. The process is generally straightforward — most employers manage the full visa application once an offer is accepted. The UAE introduced the <strong>Golden Visa</strong> for highly skilled professionals, investors, and exceptional talent, offering 10-year renewable residency. The Green Visa allows skilled workers to self-sponsor without employer dependency. Many listings on JobMeter specify whether visa sponsorship and relocation support are included in the package.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Salary and Benefits for Jobs in the UAE</h3>
      <p className="text-gray-600 mb-4">UAE salaries are tax-free, which significantly increases take-home pay compared to equivalent roles in Europe or North America. <strong>Software engineers in Dubai</strong> typically earn AED 15,000–35,000 per month. Finance professionals at DIFC firms earn AED 20,000–60,000 depending on seniority. Marketing managers average AED 18,000–30,000 per month. Many packages include housing allowance, annual flight tickets, health insurance, and school fees for dependents. Use JobMeter's salary filters to identify roles that match your expectations.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Popular Job Searches in the UAE</h3>
      <p className="text-gray-600 mb-4">Top searches on JobMeter for the UAE include: <strong>software developer jobs in Dubai</strong>, <strong>finance jobs in Abu Dhabi</strong>, <strong>hospitality jobs in Dubai 2024</strong>, <strong>project manager jobs UAE with visa sponsorship</strong>, <strong>marketing manager jobs in Dubai</strong>, <strong>engineering jobs in Abu Dhabi</strong>, <strong>healthcare jobs in UAE for international candidates</strong>, and <strong>remote jobs UAE</strong>. All listings are verified and updated daily.</p>

        </div>
      </div>
    </>
  );
}