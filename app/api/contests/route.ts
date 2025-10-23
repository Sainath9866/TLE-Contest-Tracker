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
  startTimeIST: string;
  endTimeIST: string;
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
  future_contests?: Array<{
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

function toISTString(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

async function fetchFromCodeforcesDirect(): Promise<Contest[]> {
  try {
    const res = await fetchWithTimeout('https://codeforces.com/api/contest.list');
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
    const res = await fetchWithTimeout('https://leetcode.com/graphql', {
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
    const res = await fetchWithTimeout('https://www.codechef.com/api/list/contests/all');
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
  const direct = await fetchFromDirectSources();
  if (direct.length > 0) {
    console.log('[api/contests] source=direct count=', direct.length);
    return NextResponse.json(direct, { headers: { 'x-contest-source': 'direct' } });
  }
  console.log('[api/contests] source=none count=0');
  return NextResponse.json([], { headers: { 'x-contest-source': 'none' } });
}