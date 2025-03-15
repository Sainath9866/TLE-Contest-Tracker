export interface YouTubeVideo {
  videoId: string;
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
}

export interface YouTubeSnippet {
  title: string;
  resourceId: {
    videoId: string;
  };
  thumbnails: {
    medium: {
      url: string;
    };
  };
}

export interface YouTubeApiResponse {
  items?: {
    snippet: YouTubeSnippet;
  }[];
}

export interface VideoCache {
  timestamp: number;
  videos: {
    [key: string]: YouTubeVideo;
  };
}
