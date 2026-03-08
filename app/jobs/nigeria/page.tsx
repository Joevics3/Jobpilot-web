import JobList from '@/components/jobs/JobList';
import { Metadata } from 'next';
import { BreadcrumbListSchema } from '@/components/seo/StructuredData';

export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

export const metadata: Metadata = {
  title: 'Jobs in Nigeria - Find Employment Opportunities | JobMeter',
  description: 'Browse latest job openings in Nigeria. Find full-time, part-time, and remote jobs across all industries. Apply to top Nigerian companies today.',
  alternates: {
    canonical: `${siteUrl}/jobs/nigeria`,
    languages: {
      'en-NG': `${siteUrl}/jobs/nigeria`,
      'en': `${siteUrl}/jobs/nigeria`,
    },
  },
};

export default function NigeriaJobsPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteUrl },
    { name: 'Jobs', url: `${siteUrl}/jobs` },
    { name: 'Nigeria', url: `${siteUrl}/jobs/nigeria` },
  ];

  return (
    <>
      <BreadcrumbListSchema items={breadcrumbItems} />

      <JobList initialCountry="Nigeria" />


      {/* SEO Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Finding Jobs in Nigeria</h2>
      <p className="text-gray-600 mb-4">Nigeria is Africa's largest economy and its most populous nation, with a workforce of over 80 million people and a young, fast-growing talent pool. The Nigerian job market spans traditional sectors like oil and gas, banking, and FMCG alongside a rapidly expanding technology ecosystem centred in Lagos. JobMeter aggregates <strong>current job vacancies in Nigeria</strong> from verified employers daily, covering everything from <strong>graduate trainee programmes</strong> to <strong>director-level positions</strong> across all major industries.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Top Industries Hiring in Nigeria</h3>
      <p className="text-gray-600 mb-4">Banking and financial services remain the largest formal employers, with institutions like Zenith Bank, GTBank, Access Bank, and First Bank running continuous recruitment for roles in retail banking, corporate finance, risk management, and digital banking. The <strong>oil and gas sector</strong> — including Shell, TotalEnergies, Seplat, and NNPC — offers some of the highest-paying positions in the country, particularly for engineers, HSE professionals, and project managers. Telecoms giants like MTN, Airtel, and Glo hire aggressively across commercial, technical, and customer service functions. The fast-growing <strong>Nigerian tech ecosystem</strong> — home to unicorns like Flutterwave, Paystack, and Interswitch — is creating thousands of <strong>technology jobs in Lagos</strong> annually.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Best Cities for Jobs in Nigeria</h3>
      <p className="text-gray-600 mb-4">Lagos is the commercial capital and the single largest job market in Nigeria, accounting for the majority of private sector employment. Victoria Island, Ikoyi, Lekki, and the Mainland (Ikeja, Surulere, Yaba) are home to the highest concentration of employers. Abuja offers strong opportunities in government, NGOs, international organizations, and consulting — making it ideal for professionals in policy, development, and public administration. Port Harcourt is the hub for oil and gas employment and related engineering services. Kano, Ibadan, and Enugu are growing markets for FMCG, manufacturing, and retail.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Salary Expectations for Jobs in Nigeria</h3>
      <p className="text-gray-600 mb-4">Salaries in Nigeria vary widely by sector and employer type. Multinationals and tier-one banks offer the highest packages — <strong>senior software developers in Lagos</strong> at fintech companies can earn ₦8–25 million per year, while investment bankers at leading institutions command similar figures. Mid-level marketing managers typically earn ₦3–7 million annually, while entry-level graduate roles range from ₦1.2–3 million depending on the company. Oil and gas technical roles remain among the highest-paying, with platform-based engineers earning well above market average. Use JobMeter's salary filters to target roles within your expected range.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Remote Jobs Available to Nigerians</h3>
      <p className="text-gray-600 mb-4">The global shift to remote work has opened significant opportunities for Nigerian professionals. <strong>Remote jobs for Nigerians</strong> in software development, product design, digital marketing, content writing, data analysis, and customer success are widely available from international employers. Companies in the UK, USA, Canada, and Europe actively hire Nigerian talent for remote roles, particularly in technology and creative fields. JobMeter's remote filter surfaces both Nigerian-company remote roles and international positions open to Nigerian applicants.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Graduate Jobs and Entry-Level Opportunities in Nigeria</h3>
      <p className="text-gray-600 mb-4">Nigeria's graduate job market is highly competitive, with major banks, FMCG companies, and multinationals running structured <strong>graduate trainee programmes</strong> each year. Unilever, Nestle, Nigerian Breweries, Dangote Group, and the major banks are among the most sought-after graduate employers. Tech bootcamps and training programmes from organisations like Andela, Decagon, and HNG have created a pipeline of junior developers entering the market. Applying early, building practical skills, and tailoring your CV to each employer significantly improve your chances.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Apply for Jobs in Nigeria</h3>
      <p className="text-gray-600 mb-4">A concise, well-formatted CV (two pages maximum) tailored to the specific role is the starting point for any Nigerian job application. LinkedIn is increasingly used by Nigerian recruiters, particularly in tech, finance, and professional services. Jobberman, LinkedIn, and JobMeter are the primary platforms used by top Nigerian employers. For competitive roles, following up professionally after submitting your application can set you apart. Always research the company's recent performance and values before an interview — Nigerian interviewers frequently assess cultural fit alongside technical competence.</p>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">Popular Job Searches in Nigeria</h3>
      <p className="text-gray-600 mb-4">The most searched roles on JobMeter Nigeria include: <strong>software developer jobs in Lagos</strong>, <strong>bank jobs in Nigeria 2024</strong>, <strong>graduate trainee programmes Nigeria</strong>, <strong>marketing executive jobs in Abuja</strong>, <strong>oil and gas jobs in Port Harcourt</strong>, <strong>remote jobs for Nigerians</strong>, <strong>finance manager jobs in Lagos</strong>, and <strong>NGO jobs in Abuja</strong>. New listings in all these categories are added daily.</p>

        </div>
      </div>
    </>
  );
}