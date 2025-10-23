'use client';
import { useContests } from '@/hooks/useContests';
import { ContestCard } from '@/components/ContestCard';
import { useState, useRef, useEffect } from 'react';
import { Contest } from '@/types/contest';

type FilterType = 'all' | 'leetcode' | 'codeforces' | 'codechef' | 
                 'leetcode+codeforces' | 'leetcode+codechef' | 'codechef+codeforces';

export default function Home() {
  const { contests, loading, error } = useContests();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All Contests', value: 'all' },
    { label: 'LeetCode', value: 'leetcode' },
    { label: 'CodeForces', value: 'codeforces' },
    { label: 'CodeChef', value: 'codechef' },
    { label: 'LeetCode + CodeForces', value: 'leetcode+codeforces' },
    { label: 'LeetCode + CodeChef', value: 'leetcode+codechef' },
    { label: 'CodeChef + CodeForces', value: 'codechef+codeforces' },
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
    switch (activeFilter) {
      case 'all':
        return contests;
      case 'leetcode':
      case 'codeforces':
      case 'codechef':
        return contests.filter(contest => 
          contest.platform.toLowerCase() === activeFilter
        );
      case 'leetcode+codeforces':
        return contests.filter(contest => 
          ['leetcode', 'codeforces'].includes(contest.platform.toLowerCase())
        );
      case 'leetcode+codechef':
        return contests.filter(contest => 
          ['leetcode', 'codechef'].includes(contest.platform.toLowerCase())
        );
      case 'codechef+codeforces':
        return contests.filter(contest => 
          ['codechef', 'codeforces'].includes(contest.platform.toLowerCase())
        );
      default:
        return contests;
    }
  };

  const adjustTime = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() - 5);
    newDate.setMinutes(newDate.getMinutes() - 30);
    return newDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading contests...</div>
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
          <h1 className="text-3xl font-bold text-gray-700">Upcoming Contests</h1>
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
      
      {filteredContests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
          <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5m14 8V7a2 2 0 00-2-2h-3M7 17h10m-8 4h6" />
          </svg>
          <p className="text-lg font-medium">No contests available right now.</p>
          <p className="text-sm mt-1">Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <ContestCard 
              key={contest.id} 
              contest={{
                ...contest,
                startTime: adjustTime(contest.startTime),
                endTime: adjustTime(contest.endTime)
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
