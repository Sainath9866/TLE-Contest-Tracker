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
      const videoInfo: VideoInfo = {};
      
      for (const contest of contests) {
        const video = await findVideoInPlaylist(contest.name, contest.platform);
        if (video) {
          videoInfo[contest.id] = video;
        }
      }
      
      setVideoData(videoInfo);
    }

    if (contests.length > 0) {
      fetchVideoData();
    }
  }, [contests]);

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

  // Use processedContests instead of contests
  const filteredContests = filterContests(processedContests);
  const activeLabel = filterOptions.find(option => option.value === activeFilter)?.label;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Contest Solutions</h1>
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
                      setActiveFilter(option.value as FilterType);
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
          <div key={contest.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{contest.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {formatDate(contest.startTime)}
            </p>
            {videoData[contest.id] ? (
              // If we have a video, show thumbnail and link to YouTube
              <div className="space-y-4">
                <div className="relative">
                  <Image
                    src={videoData[contest.id].thumbnailUrl}
                    alt="Video thumbnail"
                    width={640}
                    height={360}
                    className="w-full rounded-lg shadow-sm"
                  />
                  <a
                    href={videoData[contest.id].videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                  >
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </a>
                </div>
                <div className="flex justify-end">
                  <a
                    href={videoData[contest.id].videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Watch Solution →
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No video solution available yet</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}