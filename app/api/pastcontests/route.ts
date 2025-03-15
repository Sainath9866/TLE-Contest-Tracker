import { NextResponse } from 'next/server';
import { CListResponse, CListContest } from '@/types/clist';

interface Contest {
  id: number;
  name: string;
  platform: string;
  url: string;
  startTime: Date;
  endTime: Date;
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
    
    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    
    const nowISO = now.toISOString();
    const twoMonthsAgoISO = twoMonthsAgo.toISOString();
    
    const url = `https://clist.by/api/v2/contest/?username=${API_USERNAME}&api_key=${API_KEY}&resource__regex=codeforces.com|codechef.com|leetcode.com&end__gt=${twoMonthsAgoISO}&end__lt=${nowISO}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('CLIST API Response not OK:', response.status, response.statusText);
      throw new Error(`CLIST API returned ${response.status}`);
    }

    const data = await response.json() as CListResponse;
    console.log('CLIST API Response:', data); // Debug log

    if (!data || !data.objects || !Array.isArray(data.objects)) {
      console.error('Invalid API response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid API response structure');
    }

    // Check if we have any contests
    if (data.objects.length === 0) {
      console.log('No contests found in the specified time range');
      return NextResponse.json([]);
    }

    const contests: Contest[] = data.objects.map((contest: CListContest) => {
      // Validate required fields
      if (!contest.id || !contest.event || !contest.resource || !contest.start || !contest.end) {
        console.error('Invalid contest data:', contest);
        throw new Error('Invalid contest data structure');
      }

      return {
        id: contest.id,
        name: contest.event,
        platform: contest.resource.split('.')[0],
        url: contest.href,
        startTime: new Date(contest.start),
        endTime: new Date(contest.end),
        duration: (new Date(contest.end).getTime() - new Date(contest.start).getTime()) / (1000 * 60 * 60),
        status: 'past'
      };
    });
    
    // Sort by end time, most recent first
    const recentContests = contests.sort((a, b) => 
      b.endTime.getTime() - a.endTime.getTime()
    );
    
    return NextResponse.json(recentContests);
  } catch (error) {
    console.error('Error fetching recent contests from Clist:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent contests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}