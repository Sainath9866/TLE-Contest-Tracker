type PlaylistMap = {
  [key: string]: string;
};

const PLAYLIST_IDS: PlaylistMap = {
  codeforces: 'PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB',
  codechef: 'PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr',
  leetcode: 'PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr'
};

const CACHE_KEY = 'youtube_video_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function findVideoInPlaylist(contestName: string, platform: string) {
  try {
    // Check cache first
    if (typeof window !== 'undefined') {
      const cached = getCachedVideos(platform, contestName);
      if (cached) return cached;
    }

    const playlistId = PLAYLIST_IDS[platform.toLowerCase()];
    if (!playlistId) return null;

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YouTube API key not configured');
      return null;
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('maxResults', '50');
    url.searchParams.append('playlistId', playlistId);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://tle-contest-tracker.vercel.app'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Searching for contest:', contestName);

    // Platform-specific search term processing
    let searchTerm = contestName.toLowerCase();
    if (platform.toLowerCase() === 'codeforces') {
      const roundMatch = contestName.match(/round\s*#?\d+/i);
      if (roundMatch) {
        searchTerm = roundMatch[0].toLowerCase();
      }
    } else if (platform.toLowerCase() === 'codechef') {
      // Extract just the contest number/name without 'codechef'
      const startersMatch = contestName.match(/starters\s*\d+/i);
      if (startersMatch) {
        searchTerm = startersMatch[0].toLowerCase();
      }
    }

    // Find video with matching title
    const video = data.items?.find((item: any) => {
      const videoTitle = item.snippet.title.toLowerCase();
      if (platform.toLowerCase() === 'codechef') {
        // For CodeChef, remove 'codechef' from video title before matching
        const cleanedVideoTitle = videoTitle.replace(/codechef\s*/i, '');
        return cleanedVideoTitle.includes(searchTerm);
      }
      return videoTitle.includes(searchTerm);
    });

    if (!video) {
      console.log('No matching video found for:', contestName);
      return null;
    }

    const videoData = {
      videoId: video.snippet.resourceId.videoId,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
      videoUrl: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`,
      title: video.snippet.title
    };

    // Cache the result if found
    if (video && typeof window !== 'undefined') {
      updateCache(platform, contestName, videoData);
    }

    console.log('Found video:', video.snippet.title);
    return videoData;
  } catch (error) {
    console.error('YouTube API Error:', error);
    return null;
  }
}

function getCachedVideos(platform: string, contestName: string) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache = JSON.parse(cached);
    if (Date.now() - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    const key = `${platform}_${contestName}`;
    return cache.videos[key];
  } catch {
    return null;
  }
}

function updateCache(platform: string, contestName: string, videoData: any) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : { timestamp: Date.now(), videos: {} };
    
    cache.videos[`${platform}_${contestName}`] = videoData;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}
