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
        const data = await response.json();

        if (!response.ok) {
          const message = (data && typeof data === 'object' && 'error' in data) ? (data.error as string) : 'Failed to fetch past contests';
          throw new Error(message);
        }

        if (Array.isArray(data)) {
          setContests(data as Contest[]);
        } else {
          setContests([]);
          setError('Unexpected response format for past contests');
        }
      } catch (err) {
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
