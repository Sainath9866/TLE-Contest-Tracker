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
      const start = new Date(contest.startTime).getTime() + (5.5 * 60 * 60 * 1000) + (3 * 1000); // Add 5.5 hours and 3 seconds
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
    const adjustedDate = new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000) + (3 * 1000)); // Add 5.5 hours and 3 seconds
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
        return 'bg-red-100 text-red-800 font-semibold';
      case 'codechef':
        return 'bg-orange-100 text-orange-800 font-semibold';  // Updated CodeChef styling
      case 'leetcode':
        return 'bg-yellow-100 text-yellow-800 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{contest.name}</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-sm ${getPlatformColor(contest.platform)}`}>
            {contest.platform === 'codechef' ? 'CodeChef' : contest.platform}
          </span>
          <button
            onClick={() => toggleBookmark(contest)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {isBookmarked(contest.id) ? (
              <svg className="w-5 h-5 fill-blue-600" viewBox="0 0 24 24">
                <path d="M19 6.28c0-1.25-1.03-2.28-2.28-2.28H7.28C6.03 4 5 5.03 5 6.28v13.44c0 .75.9 1.13 1.42.71l5.58-4.56 5.58 4.56c.52.42 1.42.04 1.42-.71V6.28z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 hover:fill-blue-600" viewBox="0 0 24 24">
                <path d="M19 6.28c0-1.25-1.03-2.28-2.28-2.28H7.28C6.03 4 5 5.03 5 6.28v13.44c0 .75.9 1.13 1.42.71l5.58-4.56 5.58 4.56c.52.42 1.42.04 1.42-.71V6.28zM7 6.28C7 6.13 7.13 6 7.28 6h9.44c.15 0 .28.13.28.28v12.14l-4.58-3.56L7.28 19 7 6.28z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-sm ">
          <span className="font-medium">Start:</span> {formatDate(contest.startTime)}
        </p>
        <p className="text-sm ">
          <span className="font-medium">Duration:</span> {contest.duration.toFixed(1)}h
        </p>
        <p className="text-sm font-medium text-indigo-600">
          <span className="font-medium">Time Remaining:</span>
          <span className="ml-2 font-mono">{timeRemaining}</span>
        </p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t">
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(contest.status)}`}>
          {contest.status}
        </span>
        <a
          href={contest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Join Contest →
        </a>
      </div>
    </div>
  );
}
