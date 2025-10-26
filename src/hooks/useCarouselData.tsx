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

  useEffect(() => {
    fetch('/api/videos')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch carousel data');
        }
        return res.json();
      })
      .then(json => {
        if (json.success) {
          setData(json.data.all);
        } else {
          throw new Error('Invalid response format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching carousel data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}