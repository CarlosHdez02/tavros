import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface Reservation {
  id: number;
  reserva_id: number;
  hash_reserva_id: string;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
  telefono: string;
  status: string;
  nombre_plan: string;
  canal: string;
  fecha_creacion: string;
  asistencia_confirmada: number;
  pago_pendiente: boolean;
  form_asistencia_url: boolean;
  mostrar_formulario: boolean;
  rating: unknown;
  imagen: string;
}

interface ClassData {
  class: string;
  classId: string;
  reservations: Reservation[];
  totalReservations: number;
  limite: number;
  clase_online: number;
  clase_coach_id: string | null;
  extractedAt: string;
}

interface DateData {
  date: string;
  classes: Record<string, ClassData>;
  totalClasses: number;
  scrapedAt: string;
}

interface CheckinData {
  scrapedAt: string;
  dateRange: {
    startDay: number;
    endDay: number;
    month: number;
    year: number;
  };
  dates: Record<string, DateData>;
  summary: {
    totalDates: number;
    totalClasses: number;
    totalReservations: number;
  };
}

type SessionType = 'Group' | 'Semi-Private' | 'Private' | 'Open Gym' | 'Other';

interface ProcessedSession {
  id: string;
  time: string;
  date: string;
  sessionType: SessionType;
  className: string;
  capacity: number;
  reservations: Reservation[];
  reservationsCount: number;
  color: string;
  classId: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const getCurrentDateString = (): string => {
  // Use Mexico City timezone to match server
  const now = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Mexico_City' 
  });
  const date = new Date(now);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getCurrentTimeString = (): string => {
  // Use Mexico City timezone
  const now = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Mexico_City' 
  });
  const date = new Date(now);
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const extractTimeRange = (className: string): { startTime: string; endTime: string } | null => {
  const timeMatch = className.match(/(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})/);
  if (timeMatch) {
    return {
      startTime: timeMatch[1],
      endTime: timeMatch[2]
    };
  }
  return null;
};

// FIXED: Show class if current hour falls within the class time
const isClassActiveNow = (startTime: string, endTime: string, currentTime: string): boolean => {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle classes that cross midnight (e.g., 23:00 - 01:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  // Normal case: show if current time is between start and end (inclusive of start, exclusive of end)
  // At 10:00, show 10:00-11:00 class
  // At 10:59, still show 10:00-11:00 class
  // At 11:00, show 11:00-12:00 class (not 10:00-11:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const getSessionType = (className: string): SessionType => {
  const lower = className.toLowerCase();
  
  if (lower.includes('grupal')) return 'Group';
  if (lower.includes('semiprivad')) return 'Semi-Private';
  if (lower.includes('privad')) return 'Private';
  if (lower.includes('open gym')) return 'Open Gym';
  
  return 'Other';
};

const getColor = (sessionType: SessionType): string => {
  const colors: Record<SessionType, string> = {
    'Group': '#02b105',
    'Semi-Private': '#22c7dd',
    'Private': '#dbbf0a',
    'Open Gym': '#9333ea',
    'Other': '#6366f1'
  };
  return colors[sessionType];
};

const formatDate = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${weekdays[date.getDay()]}, ${day} de ${months[parseInt(month) - 1]}`;
};

// ========================================
// API CONFIGURATION
// ========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tavros-scraper-1.onrender.com';

// ========================================
// COMPONENT
// ========================================

const ScheduleTable: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDateString());
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch data from API
  const fetchCheckinData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching from: ${API_BASE_URL}/api/checkin`);
      const response = await fetch(`${API_BASE_URL}/api/checkin`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CheckinData = await response.json();
      console.log('Received data:', data);
      console.log('Available dates:', Object.keys(data.dates || {}));
      
      setCheckinData(data);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Keep server awake by pinging every 10 minutes
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/health`);
        console.log('Keep-alive ping sent');
      } catch (e) {
        console.log('Keep-alive ping failed');
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);

  // Initial data fetch and setup auto-refresh
  useEffect(() => {
    fetchCheckinData();
    
    // Refresh every 5 minutes
    const dataRefreshInterval = setInterval(() => {
      fetchCheckinData();
    }, 5 * 60 * 1000);

    return () => clearInterval(dataRefreshInterval);
  }, []);

  // Update current time every 30 seconds
  useEffect(() => {
    setCurrentTime(getCurrentTimeString());
    setCurrentDate(getCurrentDateString());
    
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
      setCurrentDate(getCurrentDateString());
    }, 30000);

    return () => clearInterval(timeInterval);
  }, []);

  // Process and filter data based on current time
  const processedData = useMemo<ProcessedSession[]>(() => {
    if (!checkinData?.dates) {
      console.log('No checkin data available');
      return [];
    }

    console.log(`Current date: ${currentDate}, Current time: ${currentTime}`);

    const sessions: ProcessedSession[] = [];
    const dateData = checkinData.dates[currentDate];
    
    if (!dateData) {
      console.log(`No data found for date: ${currentDate}`);
      console.log('Available dates:', Object.keys(checkinData.dates));
      return [];
    }

    console.log(`Processing ${Object.keys(dateData.classes).length} classes for ${currentDate}`);

    Object.entries(dateData.classes).forEach(([className, classData]) => {
      const timeRange = extractTimeRange(className);
      
      if (!timeRange) {
        console.log(`No time range found for class: ${className}`);
        return;
      }

      const isActive = isClassActiveNow(timeRange.startTime, timeRange.endTime, currentTime);
      
      console.log(`Class ${timeRange.startTime}-${timeRange.endTime}: ${isActive ? 'ACTIVE' : 'inactive'}`);

      if (!isActive) {
        return;
      }

      const sessionType = getSessionType(className);
      
      let cleanClassName = className.split(' - ')[0];
      cleanClassName = cleanClassName.replace(/\d{1,2}:\d{2}\s*(am|pm)/gi, '').trim();
      
      sessions.push({
        id: `${classData.classId}-${currentDate}`,
        time: `${timeRange.startTime} - ${timeRange.endTime}`,
        date: formatDate(currentDate),
        sessionType,
        className: cleanClassName || className.split(' - ')[0],
        capacity: classData.limite,
        reservations: classData.reservations,
        reservationsCount: classData.totalReservations,
        color: getColor(sessionType),
        classId: classData.classId
      });
    });

    console.log(`Found ${sessions.length} active sessions`);
    return sessions.sort((a, b) => a.time.localeCompare(b.time));
  }, [checkinData, currentDate, currentTime]);

  const columnHelper = createColumnHelper<ProcessedSession>();

  const columns = [
    columnHelper.accessor('time', {
      header: 'Time',
      cell: (info) => (
        <div style={{ 
          fontWeight: '700', 
          color: '#60a5fa',
          fontSize: '15px',
          whiteSpace: 'nowrap'
        }}>
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => (
        <span style={{ 
          padding: '4px 12px',
          backgroundColor: '#1e40af',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'capitalize',
          color: '#fff',
          whiteSpace: 'nowrap'
        }}>
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('sessionType', {
      header: 'Type',
      cell: (info) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: info.row.original.color,
            border: '2px solid #0f172a',
            flexShrink: 0
          }} />
          <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor('className', {
      header: 'Class Name',
      cell: (info) => (
        <div style={{ 
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('capacity', {
      header: 'Capacity',
      cell: (info) => (
        <div style={{
          textAlign: 'center',
          fontWeight: '700',
          color: '#10b981',
          fontSize: '16px'
        }}>
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('reservations', {
      header: 'Reservations',
      cell: (info) => {
        const reservations = info.getValue();
        const reservationsCount = info.row.original.reservationsCount;
        const capacity = info.row.original.capacity;
        
        if (reservations.length === 0) {
          return (
            <div style={{
              textAlign: 'center',
              fontWeight: '500',
              color: '#94a3b8',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              No reservations
            </div>
          );
        }
        
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '200px'
          }}>
            <div style={{
              textAlign: 'center',
              fontWeight: '700',
              color: '#f59e0b',
              fontSize: '14px',
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #334155'
            }}>
              {reservationsCount} / {capacity}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#e4e9f1',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                  title={`${reservation.full_name} - ${reservation.email}`}
                >
                  {reservation.name} {reservation.last_name}
                </div>
              ))}
            </div>
          </div>
        );
      }
    })
  ];

  const table = useReactTable({
    columns,
    data: processedData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading && !checkinData) {
    return (
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#94a3b8',
          marginBottom: '16px'
        }}>
          Loading schedule data...
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #334155',
          borderTop: '4px solid #60a5fa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#ef4444',
          marginBottom: '16px'
        }}>
          ⚠️ Error loading data
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#94a3b8',
          marginBottom: '24px'
        }}>
          {error}
        </div>
        <button 
          onClick={fetchCheckinData}
          style={{
            padding: '10px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Debug Info */}
      <div style={{
        marginBottom: '12px',
        padding: '12px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155',
        fontSize: '12px',
        color: '#94a3b8',
        fontFamily: 'monospace'
      }}>
        <div>Current Date: {currentDate}</div>
        <div>Current Time: {currentTime}</div>
        <div>Active Classes: {processedData.length}</div>
      </div>

      {/* Header with refresh button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 4px'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {lastUpdated && (
            <>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</>
          )}
        </div>
        <button
          onClick={fetchCheckinData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#475569' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{loading ? '⏳' : '🔄'}</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Table */}
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ 
                  borderBottom: '2px solid #475569', 
                  backgroundColor: '#0f1419' 
                }}>
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id}
                      style={{ 
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#60a5fa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px'
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    color: '#94a3b8',
                    fontSize: '16px'
                  }}>
                    No active classes at this time
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr 
                    key={row.id}
                    style={{ 
                      borderBottom: '1px solid #334155',
                      backgroundColor: index % 2 === 0 ? '#1e293b' : '#1a1f2e',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e293b' : '#1a1f2e';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id}
                        style={{ 
                          padding: '16px',
                          fontSize: '14px',
                          color: '#e4e9f1'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data source info */}
      {checkinData && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div>
            Data scraped: {new Date(checkinData.scrapedAt).toLocaleString()}
          </div>
          {checkinData.summary && (
            <div>
              {checkinData.summary.totalClasses} classes • {checkinData.summary.totalReservations} reservations
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleTable;