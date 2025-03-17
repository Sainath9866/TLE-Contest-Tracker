import { Contest } from '@/types/contest';
import { useState, useEffect } from 'react';
import { useBookmarks } from '@/context/BookmarkContext';

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const { toggleBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(contest.startTime).getTime() + (5.5 * 60 * 60 * 1000) + (3 * 1000);
      const distance = start - now;

      if (distance < 0) {
        setTimeRemaining('Contest Started');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [contest.startTime]);

  const formatDate = (date: Date) => {
    const adjustedDate = new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000) + (3 * 1000));
    return adjustedDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'codeforces':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'text-white',
          border: 'border-red-400',
          hover: 'hover:border-red-500'
        };
      case 'codechef':
        return {
          bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          text: 'text-white',
          border: 'border-yellow-400',
          hover: 'hover:border-yellow-500'
        };
      case 'leetcode':
        return {
          bg: 'bg-gradient-to-r from-green-400 to-green-500',
          text: 'text-white',
          border: 'border-green-400',
          hover: 'hover:border-green-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          text: 'text-white',
          border: 'border-gray-400',
          hover: 'hover:border-gray-500'
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800 border border-green-400';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border border-blue-400';
      case 'past':
        return 'bg-gray-100 text-gray-700 border border-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-400';
    }
  };

  const platformColors = getPlatformColor(contest.platform);

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-2 transition-all duration-300 border border-gray-600 ${platformColors.hover} overflow-hidden group`}>
      <div className={`${platformColors.bg} py-2 px-4 flex justify-between items-center`}>
        <span className={`${platformColors.text} font-medium`}>
          {contest.platform === 'codechef' ? 'CodeChef' : contest.platform}
        </span>
        <button
          onClick={() => toggleBookmark(contest)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {isBookmarked(contest.id) ? (
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
              <path d="M19 6.28c0-1.25-1.03-2.28-2.28-2.28H7.28C6.03 4 5 5.03 5 6.28v13.44c0 .75.9 1.13 1.42.71l5.58-4.56 5.58 4.56c.52.42 1.42.04 1.42-.71V6.28z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white/90 hover:text-white fill-current" viewBox="0 0 24 24">
              <path d="M19 6.28c0-1.25-1.03-2.28-2.28-2.28H7.28C6.03 4 5 5.03 5 6.28v13.44c0 .75.9 1.13 1.42.71l5.58-4.56 5.58 4.56c.52.42 1.42.04 1.42-.71V6.28zM7 6.28C7 6.13 7.13 6 7.28 6h9.44c.15 0 .28.13.28.28v12.14l-4.58-3.56L7.28 19 7 6.28z" />
            </svg>
          )}
        </button>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
          {contest.name}
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(contest.startTime)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {contest.duration.toFixed(1)}h
          </div>
          <div className="flex items-center text-sm font-medium text-blue-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeRemaining}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(contest.status)}`}>
            {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
          </span>
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center px-4 py-2 rounded-lg ${platformColors.bg} ${platformColors.text} hover:opacity-90 transition-opacity text-sm font-medium group`}
          >
            Join Contest
            <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
