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

// Fallback types for Kontests API
interface KontestsContest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string; // seconds as string
  site: string; // e.g., 'CodeForces', 'CodeChef', 'LeetCode'
  status: 'BEFORE' | 'CODING' | 'FINISHED';
}

// Direct API types
interface CFContestListResponse {
  status: 'OK' | 'FAILED';
  result: Array<{
    id: number;
    name: string;
    phase: 'BEFORE' | 'CODING' | 'FINISHED' | string;
    startTimeSeconds: number;
    durationSeconds: number;
  }>;
}

interface LeetCodeGqlResponse {
  data?: {
    allContests?: Array<{
      title: string;
      startTime: number; // seconds
      duration: number; // seconds
      titleSlug: string;
    }>;
  };
}

interface CodeChefResponse {
  future_contests?: Array<{
    contest_name: string;
    contest_code: string;
    contest_start_date: string;
    contest_end_date: string;
  }>;
}

function platformFromSite(site: string): string {
  const s = site.toLowerCase();
  if (s.includes('codeforces')) return 'codeforces';
  if (s.includes('codechef')) return 'codechef';
  if (s.includes('leetcode')) return 'leetcode';
  return site.toLowerCase();
}

function generateId(site: string, name: string, start: string | number): number {
  const seed = typeof start === 'number' ? start : new Date(start).getTime();
  const key = `${site}|${name}|${seed}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toISTString(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

async function fetchFromKontests(): Promise<Contest[]> {
  try {
    const endpoints = [
      'https://kontests.net/api/v1/codeforces',
      'https://kontests.net/api/v1/code_chef',
      'https://kontests.net/api/v1/leet_code',
    ];

    const results = await Promise.allSettled(
      endpoints.map((u) => fetch(u).then((r) => r.json() as Promise<KontestsContest[]>))
    );

    const flattened: KontestsContest[] = results.flatMap((res) =>
      res.status === 'fulfilled' && Array.isArray(res.value) ? res.value : []
    );

    const mapped: Contest[] = flattened
      .map((c) => {
        const startTime = new Date(c.start_time);
        const endTime = new Date(c.end_time);
        const status: Contest['status'] = c.status === 'BEFORE' ? 'upcoming' : c.status === 'CODING' ? 'ongoing' : 'past';
        return {
          id: generateId(c.site, c.name, c.start_time),
          name: c.name,
          platform: platformFromSite(c.site),
          url: c.url,
          startTime,
          endTime,
          startTimeIST: toISTString(startTime),
          endTimeIST: toISTString(endTime),
          duration: Number(c.duration) / 3600,
          status,
        } as Contest;
      })
      .filter((c) => c.status === 'upcoming' || c.status === 'ongoing');

    mapped.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const seen = new Set<string>();
    const deduped = mapped.filter((c) => {
      const key = `${c.platform}|${c.name}|${c.startTime.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped;
  } catch {
    return [];
  }
}

async function fetchFromCodeforcesDirect(): Promise<Contest[]> {
  try {
    const res = await fetch('https://codeforces.com/api/contest.list');
    const data = (await res.json()) as CFContestListResponse;
    if (data.status !== 'OK') return [];
    const nowMs = Date.now();
    return data.result
      .filter((c) => c.phase === 'BEFORE' || c.phase === 'CODING')
      .map((c) => {
        const startTime = new Date(c.startTimeSeconds * 1000);
        const endTime = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
        const status: Contest['status'] = nowMs < startTime.getTime() ? 'upcoming' : nowMs < endTime.getTime() ? 'ongoing' : 'past';
        return {
          id: c.id,
          name: c.name,
          platform: 'codeforces',
          url: `https://codeforces.com/contests/${c.id}`,
          startTime,
          endTime,
          startTimeIST: toISTString(startTime),
          endTimeIST: toISTString(endTime),
          duration: c.durationSeconds / 3600,
          status,
        };
      })
      .filter((c) => c.status === 'upcoming' || c.status === 'ongoing');
  } catch {
    return [];
  }
}

async function fetchFromLeetCodeDirect(): Promise<Contest[]> {
  try {
    const body = {
      query: `
        query getContestList { allContests { title startTime duration titleSlug } }
      `
    };
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = (await res.json()) as LeetCodeGqlResponse;
    const list = json.data?.allContests ?? [];
    const nowMs = Date.now();
    return list
      .filter((c) => c.startTime * 1000 > nowMs)
      .map((c) => {
        const startTime = new Date(c.startTime * 1000);
        const endTime = new Date((c.startTime + c.duration) * 1000);
        return {
          id: generateId('leetcode', c.title, c.startTime * 1000),
          name: c.title,
          platform: 'leetcode',
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          startTime,
          endTime,
          startTimeIST: toISTString(startTime),
          endTimeIST: toISTString(endTime),
          duration: c.duration / 3600,
          status: 'upcoming'
        } as Contest;
      });
  } catch {
    return [];
  }
}

async function fetchFromCodeChefDirect(): Promise<Contest[]> {
  try {
    const res = await fetch('https://www.codechef.com/api/list/contests/all');
    const json = (await res.json()) as CodeChefResponse;
    const future = json.future_contests ?? [];
    return future.map((c) => {
      const startTime = new Date(c.contest_start_date);
      const endTime = new Date(c.contest_end_date);
      const status: Contest['status'] = Date.now() < startTime.getTime() ? 'upcoming' : 'ongoing';
      return {
        id: generateId('codechef', c.contest_name, c.contest_start_date),
        name: c.contest_name,
        platform: 'codechef',
        url: `https://www.codechef.com/${c.contest_code}`,
        startTime,
        endTime,
        startTimeIST: toISTString(startTime),
        endTimeIST: toISTString(endTime),
        duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60),
        status
      } as Contest;
    });
  } catch {
    return [];
  }
}

async function fetchFromDirectSources(): Promise<Contest[]> {
  const [cf, lc, cc] = await Promise.all([
    fetchFromCodeforcesDirect(),
    fetchFromLeetCodeDirect(),
    fetchFromCodeChefDirect()
  ]);
  const merged = [...cf, ...lc, ...cc];
  if (merged.length === 0) return [];
  merged.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const seen = new Set<string>();
  return merged.filter((c) => {
    const key = `${c.platform}|${c.name}|${c.startTime.toISOString()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  try {
    const API_USERNAME = process.env.CLIST_USERNAME;
    const API_KEY = process.env.CLIST_API_KEY;

    if (!API_USERNAME || !API_KEY) {
      throw new Error('API credentials not configured');
    }

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const url = `https://clist.by/api/v2/contest/?username=${API_USERNAME}&api_key=${API_KEY}&resource__regex=codeforces.com|codechef.com|leetcode.com&start__gt=${threeHoursAgo.toISOString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = (await response.json()) as CListResponse;

    if (!data || !data.objects) {
      throw new Error('Invalid API response structure');
    }

    const contests: Contest[] = data.objects.map((contest: CListContest) => {
      const startTime = new Date(contest.start);
      const endTime = new Date(contest.end);

      return {
        id: contest.id,
        name: contest.event,
        platform: contest.resource.split('.')[0],
        url: contest.href,
        startTime: startTime,
        endTime: endTime,
        startTimeIST: toISTString(startTime),
        endTimeIST: toISTString(endTime),
        duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60),
        status: now < startTime ? 'upcoming' : now < endTime ? 'ongoing' : 'past',
      };
    });

    contests.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const upcomingContests = contests.filter((contest) => contest.status === 'upcoming');
    const ongoingContests = contests.filter((contest) => contest.status === 'ongoing');
    const relevantContests = [...ongoingContests, ...upcomingContests];

    console.log('[api/contests] source=clist count=', relevantContests.length);
    return NextResponse.json(relevantContests, { headers: { 'x-contest-source': 'clist' } });
  } catch {
    // Try direct sources first
    const direct = await fetchFromDirectSources();
    if (direct.length > 0) {
      console.log('[api/contests] source=direct count=', direct.length);
      return NextResponse.json(direct, { headers: { 'x-contest-source': 'direct' } });
    }

    // Fallback to Kontests
    const fallbackContests = await fetchFromKontests();
    if (fallbackContests.length > 0) {
      console.log('[api/contests] source=kontests count=', fallbackContests.length);
      return NextResponse.json(fallbackContests, { headers: { 'x-contest-source': 'kontests' } });
    }

    console.log('[api/contests] source=none count=0');
    return NextResponse.json([], { headers: { 'x-contest-source': 'none' } });
  }
}