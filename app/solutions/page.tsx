'use client';
import { usePastContests } from '@/hooks/usePastContests';
import { useState, useRef, useEffect } from 'react';
import { findVideoInPlaylist } from '@/utils/youtube';
import Image from 'next/image';
import { Contest } from '@/types/contest';
import { YouTubeVideo } from '@/types/youtube';

type FilterType = 'all' | 'leetcode' | 'codeforces' | 'codechef';

interface VideoData {
  [key: number]: YouTubeVideo;
}

interface VideoInfo {
  [key: number]: YouTubeVideo;
}

export default function SolutionPage() {
  const { contests, loading, error } = usePastContests();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [videoData, setVideoData] = useState<VideoData>({});
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  const filterOptions = [
    { label: 'All Platforms', value: 'all' },
    { label: 'LeetCode', value: 'leetcode' },
    { label: 'CodeForces', value: 'codeforces' },
    { label: 'CodeChef', value: 'codechef' },
  ];

  // Filter Codeforces contests immediately when data is received
  const processedContests = contests.filter(contest => {
    if (contest.platform.toLowerCase() === 'codeforces') {
      return /^Codeforces Round \d+/.test(contest.name);
    }
    return true;
  });

  const filterContests = (contests: Contest[]) => {
    if (activeFilter === 'all') return contests;
    return contests.filter(contest => 
      contest.platform.toLowerCase() === activeFilter
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

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

  useEffect(() => {
    async function fetchVideoData() {
      setIsLoadingVideos(true);
      const videoInfo: VideoInfo = {};
      
      try {
        for (const contest of contests) {
          const video = await findVideoInPlaylist(contest.name, contest.platform);
          if (video) {
            videoInfo[contest.id] = video;
          }
        }
        
        setVideoData(videoInfo);
      } catch (error) {
        console.error('Error fetching video data:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    }

    if (contests.length > 0) {
      fetchVideoData();
    }
  }, [contests]);

  const getPlatformColors = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'codeforces':
        return {
          border: 'border-red-200 hover:border-red-400',
          title: 'group-hover:text-red-600',
          badge: 'bg-red-50 text-red-600',
          icon: 'text-red-500'
        };
      case 'codechef':
        return {
          border: 'border-yellow-200 hover:border-yellow-400',
          title: 'group-hover:text-yellow-600',
          badge: 'bg-yellow-50 text-yellow-600',
          icon: 'text-yellow-500'
        };
      case 'leetcode':
        return {
          border: 'border-green-200 hover:border-green-400',
          title: 'group-hover:text-green-600',
          badge: 'bg-green-50 text-green-600',
          icon: 'text-green-500'
        };
      default:
        return {
          border: 'border-gray-200 hover:border-gray-400',
          title: 'group-hover:text-gray-600',
          badge: 'bg-gray-50 text-gray-600',
          icon: 'text-gray-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading contests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xl text-red-600 font-medium">{error}</div>
        </div>
      </div>
    );
  }

  const filteredContests = filterContests(processedContests);
  const activeLabel = filterOptions.find(option => option.value === activeFilter)?.label;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contest Solutions</h1>
              <p className="text-gray-600">Video solutions for past competitive programming contests</p>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 min-w-[160px] transition-colors"
              >
                <span className="text-gray-700">{activeLabel}</span>
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setActiveFilter(option.value as FilterType);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                        activeFilter === option.value ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
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

        {isLoadingVideos && (
          <div className="text-center mb-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-600">Loading solutions may take some time. Please be patient...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => {
            const platformColors = getPlatformColors(contest.platform);
            return (
              <div key={contest.id} className={`bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-2 transition-all duration-300 border ${platformColors.border} overflow-hidden group`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`text-lg font-semibold text-gray-900 mb-2 line-clamp-2 ${platformColors.title} transition-colors`}>
                        {contest.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(contest.startTime)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${platformColors.badge}`}>
                      {contest.platform}
                    </span>
                  </div>

                  {isLoadingVideos ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                      <div className="flex justify-end">
                        <div className="w-32 h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  ) : videoData[contest.id] ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden group">
                        <Image
                          src={videoData[contest.id].thumbnailUrl}
                          alt="Video thumbnail"
                          width={640}
                          height={360}
                          className="w-full transform transition-transform duration-300 group-hover:scale-105"
                        />
                        <a
                          href={videoData[contest.id].videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="transform transition-transform duration-300 group-hover:scale-110">
                            <svg className={`w-16 h-16 ${platformColors.icon}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </a>
                      </div>
                      <div className="flex justify-end">
                        <a
                          href={videoData[contest.id].videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center px-4 py-2 rounded-lg ${platformColors.badge} transition-colors text-sm font-medium group`}
                        >
                          Watch Solution
                          <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                      <svg className={`mx-auto h-12 w-12 ${platformColors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500 font-medium">No video solution available yet</p>
                      <p className="mt-2 text-xs text-gray-400">Check back later</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}