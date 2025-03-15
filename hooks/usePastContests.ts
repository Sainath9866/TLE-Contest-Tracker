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
        setContests(data);
      } catch (err) {
        setError('Failed to fetch past contests');
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
  }, []);

  return { contests, loading, error };
}
