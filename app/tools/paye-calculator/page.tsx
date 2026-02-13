"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Info, TrendingDown, TrendingUp, Home, PiggyBank, DollarSign, AlertCircle, Download } from 'lucide-react';
import { theme } from '@/lib/theme';

interface PAYEResult {
  grossAnnual: number;
  grossMonthly: number;
  pension: number;
  nhf: number;
  rentRelief: number;
  chargeableIncome: number;
  annualTax: number;
  monthlyTax: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
}

const TAX_BANDS = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 3000000, rate: 15 },
  { min: 3000000, max: 12000000, rate: 18 },
  { min: 12000000, max: 25000000, rate: 21 },
  { min: 25000000, max: 50000000, rate: 23 },
  { min: 50000000, max: Infinity, rate: 25 },
];

export default function PAYECalculatorPage() {
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [housingAllowance, setHousingAllowance] = useState<number>(0);
  const [transportAllowance, setTransportAllowance] = useState<number>(0);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);
  const [annualRent, setAnnualRent] = useState<number>(0);
  const [includeNHF, setIncludeNHF] = useState<boolean>(false);
  const [pensionRate, setPensionRate] = useState<number>(8);

  const calculatePAYE = useMemo((): PAYEResult => {
    const monthlyBasic = basicSalary;
    const monthlyHousing = housingAllowance;
    const monthlyTransport = transportAllowance;
    const monthlyOther = otherAllowances;

    // Gross monthly emoluments
    const grossMonthly = monthlyBasic + monthlyHousing + monthlyTransport + monthlyOther;
    const grossAnnual = grossMonthly * 12;

    // Pension calculation (on qualifying emoluments: basic + housing + transport)
    const qualifyingEmoluments = monthlyBasic + monthlyHousing + monthlyTransport;
    const pension = (qualifyingEmoluments * pensionRate / 100) * 12;

    // NHF calculation (2.5% of basic salary, voluntary)
    const nhf = includeNHF ? (monthlyBasic * 2.5 / 100) * 12 : 0;

    // Rent Relief: Lesser of ₦500,000 or 20% of annual rent paid
    const rentRelief = Math.min(500000, annualRent * 0.2);

    // Calculate chargeable income
    const chargeableIncome = Math.max(0, grossAnnual - pension - nhf - rentRelief);

    // Calculate tax using progressive bands
    let annualTax = 0;
    let remainingIncome = chargeableIncome;

    for (const band of TAX_BANDS) {
      if (remainingIncome <= 0) break;
      
      const bandSize = band.max - band.min;
      const taxableInBand = Math.min(remainingIncome, bandSize);
      
      annualTax += taxableInBand * (band.rate / 100);
      remainingIncome -= taxableInBand;
    }

    // If chargeable income is below exemption threshold
    if (chargeableIncome <= 800000) {
      annualTax = 0;
    }

    const monthlyTax = annualTax / 12;
    const netAnnual = grossAnnual - annualTax - pension - nhf;
    const netMonthly = netAnnual / 12;
    const effectiveRate = grossAnnual > 0 ? (annualTax / grossAnnual) * 100 : 0;

    return {
      grossAnnual,
      grossMonthly,
      pension,
      nhf,
      rentRelief,
      chargeableIncome,
      annualTax,
      monthlyTax,
      netAnnual,
      netMonthly,
      effectiveRate,
    };
  }, [basicSalary, housingAllowance, transportAllowance, otherAllowances, annualRent, includeNHF, pensionRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            Nigerian PAYE Calculator
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            Calculate your net salary after tax under the Nigeria Tax Act 2025
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">New Tax Rules Effective 2026</p>
            <p className="text-blue-700">
              This calculator uses the Nigeria Tax Act 2025 rates. Income up to ₦800,000 is now tax-exempt. 
              Consolidated Relief Allowance (CRA) has been replaced with Rent Relief.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              Enter Your Details
            </h2>

            <div className="space-y-4">
              {/* Basic Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Basic Salary (Monthly) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={basicSalary || ''}
                    onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Housing Allowance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Housing Allowance (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={housingAllowance || ''}
                    onChange={(e) => setHousingAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Transport Allowance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Allowance (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={transportAllowance || ''}
                    onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Other Allowances */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Allowances (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={otherAllowances || ''}
                    onChange={(e) => setOtherAllowances(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bonuses, overtime, etc."
                  />
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Annual Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Rent Paid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={annualRent || ''}
                    onChange={(e) => setAnnualRent(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="For rent relief calculation"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rent Relief: min(₦500,000, 20% of rent paid)
                </p>
              </div>

              {/* NHF Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Include NHF</label>
                  <p className="text-xs text-gray-500">National Housing Fund (2.5%)</p>
                </div>
                <button
                  onClick={() => setIncludeNHF(!includeNHF)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    includeNHF ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      includeNHF ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Pension Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pension Contribution (%)
                </label>
                <select
                  value={pensionRate}
                  onChange={(e) => setPensionRate(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={8}>8% (Standard)</option>
                  <option value={10}>10%</option>
                  <option value={12}>12%</option>
                  <option value={14}>14%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Main Results Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Your Salary Breakdown
              </h2>

              {/* Gross */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Gross Monthly</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculatePAYE.grossMonthly)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(calculatePAYE.grossAnnual)} /year</p>
              </div>

              {/* Net */}
              <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 mb-1">Net Monthly (Take Home)</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(calculatePAYE.netMonthly)}</p>
                <p className="text-xs text-green-600">{formatCurrency(calculatePAYE.netAnnual)} /year</p>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingDown size={14} className="text-red-500" />
                    PAYE Tax
                  </span>
                  <span className="font-medium text-red-600">-{formatCurrency(calculatePAYE.annualTax)}/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <PiggyBank size={14} className="text-blue-500" />
                    Pension
                  </span>
                  <span className="font-medium text-gray-700">-{formatCurrency(calculatePAYE.pension)}/yr</span>
                </div>
                {calculatePAYE.nhf > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Home size={14} className="text-purple-500" />
                      NHF
                    </span>
                    <span className="font-medium text-gray-700">-{formatCurrency(calculatePAYE.nhf)}/yr</span>
                  </div>
                )}
                {calculatePAYE.rentRelief > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Home size={14} className="text-green-500" />
                      Rent Relief (added back)
                    </span>
                    <span className="font-medium text-green-600">+{formatCurrency(calculatePAYE.rentRelief)}</span>
                  </div>
                )}
              </div>

              {/* Effective Rate */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Effective Tax Rate</span>
                  <span className="font-bold text-blue-700">{formatPercent(calculatePAYE.effectiveRate)}</span>
                </div>
              </div>
            </div>

            {/* Tax Bands Reference */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
              <h3 className="font-bold text-gray-900 mb-3">Tax Bands (2026)</h3>
              <div className="space-y-2 text-sm">
                {TAX_BANDS.slice(0, -1).map((band, index) => (
                  <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">
                      ₦{(band.min / 1000000).toFixed(1)}M - ₦{(band.max / 1000000).toFixed(1)}M
                    </span>
                    <span className="font-medium">{band.rate}%</span>
                  </div>
                ))}
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Above ₦50M</span>
                  <span className="font-medium">25%</span>
                </div>
              </div>
            </div>

            {/* Exemption Notice */}
            {calculatePAYE.chargeableIncome <= 800000 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Calculator size={18} />
                  Tax Exempt!
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your chargeable income is below ₦800,000. You are exempt from PAYE tax.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Employer Remittance Deadline</p>
              <p className="text-yellow-700">
                Employers must remit PAYE by the 10th of the following month. This calculator provides estimates. 
                Consult a tax professional or the FIRS for exact calculations.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Content - Improved */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nigerian PAYE Tax Calculator</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Calculate your net salary with the new 2026 Nigeria Tax Act rates. Includes pension, NHF, and rent relief calculations.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Calculator className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2026 Tax Rates</h3>
              <p className="text-sm text-gray-700">New progressive tax bands from 0% to 25%.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <PiggyBank className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Rent Relief</h3>
              <p className="text-sm text-gray-700">New tax relief up to ₦500,000 for renters.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                <Home className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">₦800k Exemption</h3>
              <p className="text-sm text-gray-700">Income up to ₦800,000 is now tax-free.</p>
            </div>
          </div>

          {/* Main SEO Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                Nigeria's New Tax System (2025 Act)
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>The Nigeria Tax Act 2025, signed in June 2025 and effective from January 2026, introduced significant changes to personal income tax. The new progressive system provides complete tax exemption for low earners.</p>
                <p>Employees earning up to ₦800,000 annually now pay zero tax. This is a major improvement for minimum wage workers in Nigeria.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                2026 Tax Bands
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Income Bracket</th>
                        <th className="px-3 py-2 text-left">Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['₦0 - ₦800,000', '0%'],
                        ['₦800,001 - ₦3,000,000', '15%'],
                        ['₦3,000,001 - ₦12,000,000', '18%'],
                        ['₦12,000,001 - ₦25,000,000', '21%'],
                        ['₦25,000,001 - ₦50,000,000', '23%'],
                        ['Above ₦50,000,000', '25%'],
                      ].map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{row[0]}</td>
                          <td className="px-3 py-2 font-medium">{row[1]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                Rent Relief Explained
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>The old Consolidated Relief Allowance (CRA) has been replaced with Rent Relief. If you pay rent, you can claim:</p>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-purple-800 font-medium">Lesser of ₦500,000 OR 20% of annual rent paid</p>
                </div>
                <p>You'll need proof of tenancy agreement or rent receipts to claim this relief.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">4</span>
                Deductions
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-900">Pension</h4>
                    <p className="text-sm text-blue-800">8% of qualifying emoluments</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-semibold text-green-900">NHF (Optional)</h4>
                    <p className="text-sm text-green-800">2.5% of basic salary</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Calculate Your Net Salary</h3>
              <p className="text-white/90 mb-4">Use our free PAYE calculator to estimate your take-home pay under the new 2026 tax rules.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Tool</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">2026 Rates</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Instant Results</span>
              </div>
            </div>
          </div>

          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Nigerian PAYE Calculator",
                "description": "Free online PAYE tax calculator for Nigeria. Calculate net salary with 2026 tax rates, pension, NHF, and rent relief.",
                "url": "https://jobmeter.com/tools/paye-calculator",
                "applicationCategory": "Finance",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}
