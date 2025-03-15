'use client';
import { usePastContests } from '@/hooks/usePastContests';
import { ContestCard } from '@/components/ContestCard';
import { useState, useRef, useEffect } from 'react';
import { Contest } from '@/types/contest'; // Add this import

type FilterType = 'all' | 'leetcode' | 'codeforces' | 'codechef';

export default function PastContests() {
  const { contests, loading, error } = usePastContests();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All Contests', value: 'all' },
    { label: 'LeetCode', value: 'leetcode' },
    { label: 'CodeForces', value: 'codeforces' },
    { label: 'CodeChef', value: 'codechef' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterContests = (contests: Contest[]) => {
    if (activeFilter === 'all') return contests;
    return contests.filter(contest => 
      contest.platform.toLowerCase() === activeFilter
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading past contests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const filteredContests = filterContests(contests);
  const activeLabel = filterOptions.find(option => option.value === activeFilter)?.label;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Past Contests</h1>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span>{activeLabel}</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-10">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setActiveFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      activeFilter === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContests.map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </div>
    </div>
  );
}
