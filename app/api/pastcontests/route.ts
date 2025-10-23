import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 9;

const DEFAULT_TIMEOUT = 3500;
const UA = 'TLEContestTracker/1.0 (+https://tle-contest-tracker.vercel.app)';

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers as HeadersInit | undefined);
    if (!headers.has('User-Agent')) headers.set('User-Agent', UA);
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store', headers });
  } finally {
    clearTimeout(id);
  }
}

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

async function fetchPastFromCodeforcesDirect(twoMonthsAgoISO: string, nowISO: string): Promise<Contest[]> {
  try {
    const res = await fetchWithTimeout('https://codeforces.com/api/contest.list');
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
    const res = await fetchWithTimeout('https://leetcode.com/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    const res = await fetchWithTimeout('https://www.codechef.com/api/list/contests/all');
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
  const now = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(now.getMonth() - 2);

  const [cf, lc, cc] = await Promise.all([
    fetchPastFromCodeforcesDirect(twoMonthsAgo.toISOString(), now.toISOString()),
    fetchPastFromLeetCodeDirect(twoMonthsAgo.toISOString(), now.toISOString()),
    fetchPastFromCodeChefDirect(twoMonthsAgo.toISOString(), now.toISOString())
  ]);
  const merged = [...cf, ...lc, ...cc];
  if (merged.length > 0) {
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

  console.log('[api/pastcontests] source=none count=0');
  return NextResponse.json([], { headers: { 'x-contest-source': 'none' } });
}