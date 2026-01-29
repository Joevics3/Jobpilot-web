"use client";

import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { theme } from '@/lib/theme';

interface JobFiltersProps {
  filters: {
    search?: string;
    location?: string[];
    sector?: string[];
    employmentType?: string[];
    salaryRange?: { min: number; max: number };
    remote?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const locations = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const sectors = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Construction', 'Transportation', 'Media', 'Hospitality',
  'Agriculture', 'Telecommunications', 'Energy', 'Real Estate', 'Consulting'
];

const employmentTypes = [
  'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Remote'
];

export default function JobFilters({ filters, onFiltersChange, isOpen, onToggle }: JobFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['location']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.location?.includes(location)
      ? filters.location.filter(l => l !== location)
      : [...(filters.location || []), location];
    
    onFiltersChange({ ...filters, location: newLocations });
  };

  const handleSectorToggle = (sector: string) => {
    const newSectors = filters.sector?.includes(sector)
      ? filters.sector.filter(s => s !== sector)
      : [...(filters.sector || []), sector];
    
    onFiltersChange({ ...filters, sector: newSectors });
  };

  const handleEmploymentTypeToggle = (type: string) => {
    const newTypes = filters.employmentType?.includes(type)
      ? filters.employmentType.filter(t => t !== type)
      : [...(filters.employmentType || []), type];
    
    onFiltersChange({ ...filters, employmentType: newTypes });
  };

  const handleSalaryRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    const currentRange = filters.salaryRange || { min: 0, max: 0 };
    const newRange = { ...currentRange, [type]: numValue };
    
    onFiltersChange({ ...filters, salaryRange: newRange });
  };

  const handleRemoteToggle = () => {
    onFiltersChange({ ...filters, remote: !filters.remote });
  };

  const clearAllFilters = () => {
    // Optimized clearing - create new object once
    const clearedFilters = {
      search: filters.search,
      location: [] as string[],
      sector: [] as string[],
      employmentType: [] as string[],
      salaryRange: undefined,
      remote: false
    };
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = (
    (filters.location?.length || 0) > 0 ||
    (filters.sector?.length || 0) > 0 ||
    (filters.employmentType?.length || 0) > 0 ||
    filters.salaryRange ||
    filters.remote
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Side Modal */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}

            {/* Location Filter */}
            <div>
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between py-2 font-semibold text-gray-900"
              >
                Location ({locations.length} states)
                {expandedSections.includes('location') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.includes('location') && (
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {locations.map(location => (
                    <label key={location} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={filters.location?.includes(location) || false}
                        onChange={() => handleLocationToggle(location)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sector Filter */}
            <div>
              <button
                onClick={() => toggleSection('sector')}
                className="w-full flex items-center justify-between py-2 font-semibold text-gray-900"
              >
                Sector
                {expandedSections.includes('sector') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.includes('sector') && (
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {sectors.map(sector => (
                    <label key={sector} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={filters.sector?.includes(sector) || false}
                        onChange={() => handleSectorToggle(sector)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{sector}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Employment Type Filter */}
            <div>
              <button
                onClick={() => toggleSection('employmentType')}
                className="w-full flex items-center justify-between py-2 font-semibold text-gray-900"
              >
                Employment Type
                {expandedSections.includes('employmentType') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.includes('employmentType') && (
                <div className="mt-2 space-y-2">
                  {employmentTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={filters.employmentType?.includes(type) || false}
                        onChange={() => handleEmploymentTypeToggle(type)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Salary Range Filter */}
            <div>
              <button
                onClick={() => toggleSection('salary')}
                className="w-full flex items-center justify-between py-2 font-semibold text-gray-900"
              >
                Salary Range
                {expandedSections.includes('salary') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.includes('salary') && (
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Min Salary (₦)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.salaryRange?.min || ''}
                      onChange={(e) => handleSalaryRangeChange('min', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Max Salary (₦)</label>
                    <input
                      type="number"
                      placeholder="No limit"
                      value={filters.salaryRange?.max || ''}
                      onChange={(e) => handleSalaryRangeChange('max', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Remote Work Filter */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remote-filter"
                checked={filters.remote || false}
                onChange={handleRemoteToggle}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remote-filter" className="text-sm font-medium text-gray-700 cursor-pointer">
                Remote Only
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}