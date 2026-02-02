"use client";

interface CategoryFilterProps {
  categories: string[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6 lg:mb-8">
      <div className="relative inline-block w-full sm:w-auto">
        <select 
          className="appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 sm:py-2 px-3 sm:px-4 pr-8 sm:pr-10 rounded-lg leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer w-full sm:w-auto text-sm sm:text-base"
          onChange={(e) => {
            const category = e.target.value;
            if (category) {
              window.location.href = `/blog?category=${encodeURIComponent(category)}`;
            }
          }}
        >
          <option value="">Filter by Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
