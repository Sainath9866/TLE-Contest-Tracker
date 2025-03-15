# TLE Contest Tracker

<div align="center">
  <img src="assets/demo.gif" alt="TLE Contest Tracker Demo" width="100%">
</div>
<br/>

[Live Demo](https://tle-contest-tracker.vercel.app/) | [Video Demo](https://youtu.be/hHWDwNRfZm4)

> **Note**: When viewing solutions, please wait for a minute or two as it may take time to fetch data from YouTube. This fetch happens only once per day - subsequent requests will use cached data for faster loading.

A comprehensive platform to track competitive programming contests and their solutions. Built with Next.js and TypeScript.

[View Demo Video](https://youtu.be/hHWDwNRfZm4)

## Features

### 1. Contest Tracking
- **Data Source**: Uses [CLIST API](https://clist.by/api/v2/) to fetch contest information
- **Supported Platforms**:
  - CodeForces
  - LeetCode
  - CodeChef
- **Contest Types**:
  - Upcoming contests (next 24 hours)
  - Past contests (last 2 months)
  - Real-time contest status updates

### 2. Video Solutions Integration
- **Platform**: YouTube Data API v3
- **Playlists**:
  - CodeForces: Solutions for regular rounds
  - LeetCode: Contest solutions and explanations
  - CodeChef: Solutions for Starters contests
- **Features**:
  - Automatic video matching with contest names
  - Thumbnail previews
  - Direct links to video solutions
  - Local caching to reduce API calls

### 3. Bookmark System
- **Storage**: Browser's LocalStorage
- **Features**:
  - Persistent bookmarks across sessions
  - Quick access to favorite contests
  - Toggle bookmark status
  - Dedicated bookmarks page

## Technical Implementation

### Contest Data Fetching
```typescript
// Fetches upcoming contests
GET /api/contests
// Parameters: None
// Returns: Array of upcoming and ongoing contests

// Fetches past contests
GET /api/pastcontests
// Parameters: None
// Returns: Array of contests from the last 2 months (we can increase the limit)
```

### YouTube Integration
```typescript
// Playlist IDs for each platform
const PLAYLIST_IDS = {
  codeforces: 'PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB',
  codechef: 'PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr',
  leetcode: 'PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr'
};

// Video matching system
// - Intelligent title matching for each platform
// - Fetching the thumbnail url and displaying to the user
// - Special handling for CodeForces rounds
// - Clean title matching for CodeChef contests
```

### Bookmark System
```typescript
// LocalStorage Structure
{
  "bookmarks": [
    {
      id: number,
      name: string,
      platform: string,
      url: string,
      startTime: Date,
      endTime: Date,
      duration: number,
      status: 'upcoming' | 'ongoing' | 'past'
    }
  ]
}
```

## Environment Variables
```bash
# Required environment variables
CLIST_USERNAME=your_clist_username
CLIST_API_KEY=your_clist_api_key
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
```

## Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with required environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Usage Limits
- CLIST API: Rate limits apply based on your subscription
- YouTube Data API: Daily quota limits apply
- Local caching implemented to optimize API calls (one YouTube API call every 24 hours)

## Contributing
Feel free to open issues and submit PRs for improvements.

## License
MIT License
