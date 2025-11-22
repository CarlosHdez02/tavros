import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CheckinData {
  dates: Record<string, any>;
  summary?: {
    totalDates: number;
    totalClasses: number;
    totalReservations: number;
  };
  scrapedAt: string;
}

interface CalendarData {
  events: any[];
  totalEvents: number;
  scrapedAt: string;
}

export const useBoxMagicAPI = () => {
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch check-in data
  const fetchCheckinData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/checkin`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch check-in data');
      }
      
      const data = await response.json();
      setCheckinData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch calendar data
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/calendar`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      
      const data = await response.json();
      setCalendarData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for specific date
  const fetchCheckinByDate = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/checkin/${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch check-in data for date');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual scraping
  const triggerScrape = async (type: 'checkin' | 'calendar' = 'checkin') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger scraping');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchCheckinData();
    fetchCalendarData();
  }, []);

  return {
    checkinData,
    calendarData,
    loading,
    error,
    fetchCheckinData,
    fetchCalendarData,
    fetchCheckinByDate,
    triggerScrape,
  };
};