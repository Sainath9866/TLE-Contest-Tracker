import { useState, useEffect } from 'react';
import { Contest } from '@/types/contest';

export function usePastContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContests() {
      try {
        const response = await fetch('/api/pastcontests');
        const text = await response.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : [];
        } catch (parseErr) {
          console.error('[usePastContests] Non-JSON response body:', text);
          throw new Error('Unexpected non-JSON response from /api/pastcontests');
        }

        if (!response.ok) {
          const message = (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) ? ((data as Record<string, unknown>).error as string) : 'Failed to fetch past contests';
          throw new Error(message);
        }

        if (Array.isArray(data)) {
          setContests(data as Contest[]);
        } else {
          setContests([]);
          setError('Unexpected response format for past contests');
        }
      } catch (err) {
        console.error('[usePastContests] Error fetching past contests:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch past contests');
        setContests([]);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
  }, []);

  return { contests, loading, error };
}
