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
  present_contests?: Array<{
    contest_name: string;
    contest_code: string;
    contest_start_date: string;
    contest_end_date: string;
  }>;
  past_contests?: Array<{
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

async function fetchPastFromKontests(twoMonthsAgoISO: string, nowISO: string): Promise<Contest[]> {
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

    const twoMonthsAgo = new Date(twoMonthsAgoISO);
    const now = new Date(nowISO);

    const mapped: Contest[] = flattened
      .filter((c) => c.status === 'FINISHED')
      .map((c) => {
        const startTime = new Date(c.start_time);
        const endTime = new Date(c.end_time);
        return {
          id: generateId(c.site, c.name, c.start_time),
          name: c.name,
          platform: platformFromSite(c.site),
          url: c.url,
          startTime,
          endTime,
          duration: Number(c.duration) / 3600,
          status: 'past',
        } as Contest;
      })
      .filter((c) => c.endTime >= twoMonthsAgo && c.endTime <= now);

    mapped.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

    const seen = new Set<string>();
    const deduped = mapped.filter((c) => {
      const key = `${c.platform}|${c.name}|${c.startTime.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped;
  } catch (e) {
    return [];
  }
}

function toISTString(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

async function fetchPastFromCodeforcesDirect(twoMonthsAgoISO: string, nowISO: string): Promise<Contest[]> {
  try {
    const res = await fetch('https://codeforces.com/api/contest.list');
    const data = (await res.json()) as CFContestListResponse;
    if (data.status !== 'OK') return [];
    const twoMonthsAgo = new Date(twoMonthsAgoISO);
    const now = new Date(nowISO);
    return data.result
      .filter((c) => c.phase === 'FINISHED')
      .map((c) => {
        const startTime = new Date(c.startTimeSeconds * 1000);
        const endTime = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
        return {
          id: c.id,
          name: c.name,
          platform: 'codeforces',
          url: `https://codeforces.com/contests/${c.id}`,
          startTime,
          endTime,
          duration: c.durationSeconds / 3600,
          status: 'past',
        } as Contest;
      })
      .filter((c) => c.endTime >= twoMonthsAgo && c.endTime <= now)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  } catch {
    return [];
  }
}

async function fetchPastFromLeetCodeDirect(twoMonthsAgoISO: string, nowISO: string): Promise<Contest[]> {
  try {
    const body = { query: `query getContestList { allContests { title startTime duration titleSlug } }` };
    const res = await fetch('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = (await res.json()) as LeetCodeGqlResponse;
    const list = json.data?.allContests ?? [];
    const twoMonthsAgoMs = new Date(twoMonthsAgoISO).getTime();
    const nowMs = new Date(nowISO).getTime();
    return list
      .map((c) => {
        const startTime = new Date(c.startTime * 1000);
        const endTime = new Date((c.startTime + c.duration) * 1000);
        const isPast = endTime.getTime() < Date.now();
        return {
          id: generateId('leetcode', c.title, c.startTime * 1000),
          name: c.title,
          platform: 'leetcode',
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          startTime,
          endTime,
          duration: c.duration / 3600,
          status: isPast ? 'past' : 'upcoming'
        } as Contest;
      })
      .filter((c) => c.status === 'past' && c.endTime.getTime() >= twoMonthsAgoMs && c.endTime.getTime() <= nowMs)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  } catch {
    return [];
  }
}

async function fetchPastFromCodeChefDirect(twoMonthsAgoISO: string, nowISO: string): Promise<Contest[]> {
  try {
    const res = await fetch('https://www.codechef.com/api/list/contests/all');
    const json = (await res.json()) as CodeChefResponse;
    const past = [...(json.present_contests ?? []), ...(json.past_contests ?? [])];
    const twoMonthsAgo = new Date(twoMonthsAgoISO);
    const now = new Date(nowISO);
    return past
      .map((c) => {
        const startTime = new Date(c.contest_start_date);
        const endTime = new Date(c.contest_end_date);
        return {
          id: generateId('codechef', c.contest_name, c.contest_start_date),
          name: c.contest_name,
          platform: 'codechef',
          url: `https://www.codechef.com/${c.contest_code}`,
          startTime,
          endTime,
          duration: (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60),
          status: 'past'
        } as Contest;
      })
      .filter((c) => c.endTime >= twoMonthsAgo && c.endTime <= now)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const API_USERNAME = process.env.CLIST_USERNAME;
    const API_KEY = process.env.CLIST_API_KEY;

    if (!API_USERNAME || !API_KEY) {
      throw new Error('API credentials not configured');
    }

    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);

    const nowISO = now.toISOString();
    const twoMonthsAgoISO = twoMonthsAgo.toISOString();

    const url = `https://clist.by/api/v2/contest/?username=${API_USERNAME}&api_key=${API_KEY}&resource__regex=codeforces.com|codechef.com|leetcode.com&end__gt=${twoMonthsAgoISO}&end__lt=${nowISO}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CLIST API returned ${response.status}`);
    }

    const data = (await response.json()) as CListResponse;
    if (!data || !data.objects || !Array.isArray(data.objects)) {
      throw new Error('Invalid API response structure');
    }

    if (data.objects.length === 0) {
      console.log('[api/pastcontests] source=clist count=0');
      return NextResponse.json([], { headers: { 'x-contest-source': 'clist' } });
    }

    const contests: Contest[] = data.objects.map((contest: CListContest) => {
      return {
        id: contest.id,
        name: contest.event,
        platform: contest.resource.split('.')[0],
        url: contest.href,
        startTime: new Date(contest.start),
        endTime: new Date(contest.end),
        duration: (new Date(contest.end).getTime() - new Date(contest.start).getTime()) / (1000 * 60 * 60),
        status: 'past',
      };
    });

    const recentContests = contests.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    console.log('[api/pastcontests] source=clist count=', recentContests.length);
    return NextResponse.json(recentContests, { headers: { 'x-contest-source': 'clist' } });
  } catch (error) {
    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);

    // Try direct sources
    const [cf, lc, cc] = await Promise.all([
      fetchPastFromCodeforcesDirect(twoMonthsAgo.toISOString(), now.toISOString()),
      fetchPastFromLeetCodeDirect(twoMonthsAgo.toISOString(), now.toISOString()),
      fetchPastFromCodeChefDirect(twoMonthsAgo.toISOString(), now.toISOString())
    ]);
    const merged = [...cf, ...lc, ...cc];
    if (merged.length > 0) {
      // Deduplicate
      const seen = new Set<string>();
      const deduped = merged.filter((c) => {
        const key = `${c.platform}|${c.name}|${c.startTime.toISOString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

      console.log('[api/pastcontests] source=direct count=', deduped.length);
      return NextResponse.json(deduped, { headers: { 'x-contest-source': 'direct' } });
    }

    // Fallback to Kontests
    const fallbackContests = await fetchPastFromKontests(twoMonthsAgo.toISOString(), now.toISOString());
    if (fallbackContests.length > 0) {
      console.log('[api/pastcontests] source=kontests count=', fallbackContests.length);
      return NextResponse.json(fallbackContests, { headers: { 'x-contest-source': 'kontests' } });
    }

    console.log('[api/pastcontests] source=none count=0');
    return NextResponse.json([], { headers: { 'x-contest-source': 'none' } });
  }
}