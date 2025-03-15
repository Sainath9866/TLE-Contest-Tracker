import { NextResponse } from 'next/server';
import { CListResponse, CListContest } from '@/types/clist';

interface Contest {
  id: number;
  name: string;
  platform: string;
  url: string;
  startTime: Date;
  endTime: Date;
  startTimeIST: string;
  endTimeIST: string;
  duration: number;
  status: 'upcoming' | 'ongoing' | 'past';
}

export async function GET() {
  try {
    const API_USERNAME = process.env.CLIST_USERNAME;
    const API_KEY = process.env.CLIST_API_KEY;
    
    if (!API_USERNAME || !API_KEY) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }
    
    // Get current time
    const now = new Date();
    
    // For the API request, we'll fetch a wider range of contests to ensure we don't miss any
    // We'll use a time slightly in the past to catch contests that might have just started
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    const url = `https://clist.by/api/v2/contest/?username=${API_USERNAME}&api_key=${API_KEY}&resource__regex=codeforces.com|codechef.com|leetcode.com&start__gt=${threeHoursAgo.toISOString()}`;    
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('API Response not OK:', response.status, response.statusText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json() as CListResponse;
    

    if (!data || !data.objects) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    const contests: Contest[] = data.objects.map((contest: CListContest) => {
      const startTime = new Date(contest.start);
      const endTime = new Date(contest.end);
      
      // Format times in IST
      const startTimeIST = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(startTime);
      
      const endTimeIST = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(endTime);
      
      return {
        id: contest.id,
        name: contest.event,
        platform: contest.resource.split('.')[0],
        url: contest.href,
        startTime: startTime,
        endTime: endTime,
        startTimeIST: startTimeIST,
        endTimeIST: endTimeIST,
        duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60),
        status: now < startTime ? 'upcoming' :
                now < endTime ? 'ongoing' : 'past'
      };
    });
    
    // Sort contests by start time
    contests.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Filter to get only upcoming contests
    const upcomingContests = contests.filter(contest => contest.status === 'upcoming');
    
    // Include currently ongoing contests as well
    const ongoingContests = contests.filter(contest => contest.status === 'ongoing');
    
    // Combine ongoing and upcoming contests
    const relevantContests = [...ongoingContests, ...upcomingContests];
    
    return NextResponse.json(relevantContests);
  } catch (error) {
    console.error('Error fetching contests from Clist:', error);
    // Return more detailed error information
    return NextResponse.json(
      { error: 'Failed to fetch contests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}