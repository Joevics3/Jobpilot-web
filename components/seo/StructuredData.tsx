"use client";

import Script from 'next/script';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

interface WebSiteSchemaProps {
  url?: string;
  name?: string;
  description?: string;
  searchAction?: {
    target: string;
    queryInput: string;
  };
}

interface JobPostingSchemaProps {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization: {
    name: string;
    sameAs?: string;
  };
  jobLocation?: {
    address: {
      addressLocality: string;
      addressRegion?: string;
      addressCountry: string;
    };
  };
  baseSalary?: {
    currency: string;
    value: {
      minValue?: number;
      maxValue?: number;
      value?: number;
    };
  };
  url: string;
}

export function OrganizationSchema({ 
  name = 'JobMeter',
  url = 'https://www.jobmeter.app',
  logo = 'https://www.jobmeter.app/logo.png',
  description = 'AI-powered job discovery and matching platform'
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [
      // Add social media links if available
    ],
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema({
  url = 'https://www.jobmeter.app',
  name = 'JobMeter',
  description = 'AI-powered job discovery and matching platform',
  searchAction,
}: WebSiteSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
  };

  if (searchAction) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: searchAction.target,
      'query-input': searchAction.queryInput,
    };
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function JobPostingSchema({
  title,
  description,
  datePosted,
  validThrough,
  employmentType,
  hiringOrganization,
  jobLocation,
  baseSalary,
  url,
}: JobPostingSchemaProps) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganization.name,
      ...(hiringOrganization.sameAs && { sameAs: hiringOrganization.sameAs }),
    },
    url,
  };

  if (validThrough) {
    schema.validThrough = validThrough;
  }

  if (employmentType) {
    schema.employmentType = employmentType;
  }

  if (jobLocation) {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: jobLocation.address.addressLocality,
        ...(jobLocation.address.addressRegion && {
          addressRegion: jobLocation.address.addressRegion,
        }),
        addressCountry: jobLocation.address.addressCountry,
      },
    };
  }

  if (baseSalary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: baseSalary.currency,
      value: {
        '@type': 'QuantitativeValue',
        ...(baseSalary.value.minValue && { minValue: baseSalary.value.minValue }),
        ...(baseSalary.value.maxValue && { maxValue: baseSalary.value.maxValue }),
        ...(baseSalary.value.value && { value: baseSalary.value.value }),
      },
    };
  }

  return (
    <Script
      id="job-posting-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

