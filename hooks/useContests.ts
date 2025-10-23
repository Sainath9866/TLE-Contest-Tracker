import { useState, useEffect } from 'react';
import { Contest } from '@/types/contest';

export function useContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContests() {
      try {
        const response = await fetch('/api/contests');
        const source = response.headers.get('x-contest-source');
        const text = await response.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : [];
        } catch (parseErr) {
          console.error('[useContests] Non-JSON response body:', text);
          throw new Error('Unexpected non-JSON response from /api/contests');
        }

        console.log('[useContests] GET /api/contests status:', response.status);
        console.log('[useContests] x-contest-source:', source);
        console.log('[useContests] GET /api/contests body:', data);

        if (!response.ok) {
          const message = (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) ? ((data as Record<string, unknown>).error as string) : 'Failed to fetch contests';
          throw new Error(message);
        }

        if (Array.isArray(data)) {
          setContests(data as Contest[]);
        } else {
          console.warn('[useContests] Unexpected response format, expected array.');
          setContests([]);
          setError('Unexpected response format for contests');
        }
      } catch (err) {
        console.error('[useContests] Error fetching contests:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch contests');
        setContests([]);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
  }, []);

  return { contests, loading, error };
}
