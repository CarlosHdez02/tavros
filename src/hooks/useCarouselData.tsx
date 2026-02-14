// hooks/useCarouselData.ts
'use client'
import { useEffect, useState } from 'react';

export type RowType = 'table' | 'video' | 'gallery';

export interface CarouselRow {
  id: number;
  type: RowType;
  title: string;
  description: string;
  youtubeLink?: string;
  durationSeconds?: number;
}

export function useCarouselData() {
  const [data, setData] = useState<CarouselRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (retryCount = 0) => {
    const maxRetries = 2;

    fetch('/api/videos')
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (retryCount < maxRetries && res.status >= 500) {
            setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
          setError('Failed to fetch carousel data');
          setLoading(false);
          return;
        }
        if (json.success && Array.isArray(json.data?.all)) {
          setData(json.data.all);
          setError(null);
        } else if (retryCount < maxRetries) {
          setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
          return;
        } else {
          setError('Invalid response format');
        }
        setLoading(false);
      })
      .catch(() => {
        if (retryCount < maxRetries) {
          setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        setError('Failed to fetch carousel data');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // Refetch periodically to get updated Excel data
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}