import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';
import checkinData from '../data/checkin_data_16_11_2025.json';

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

// Get current date in DD-MM-YYYY format
const getCurrentDateString = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

// Get current time in HH:MM format (24-hour)
const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Convert time string (HH:MM) to minutes since midnight for comparison
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Extract time range from class name (format: "HH:MM a HH:MM")
const extractTimeRange = (className: string): { startTime: string; endTime: string } | null => {
  // Pattern matches "HH:MM a HH:MM" in the class name
  const timeMatch = className.match(/(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})/);
  if (timeMatch) {
    return {
      startTime: timeMatch[1],
      endTime: timeMatch[2]
    };
  }
  return null;
};

// Check if current time falls within the class time range
const isTimeInRange = (startTime: string, endTime: string, currentTime: string): boolean => {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle case where end time is next day (e.g., 23:00 to 00:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// Determine session type from class name
const getSessionType = (className: string): SessionType => {
  const lower = className.toLowerCase();
  
  if (lower.includes('grupal')) return 'Group';
  if (lower.includes('semiprivad')) return 'Semi-Private';
  if (lower.includes('privad')) return 'Private';
  if (lower.includes('open gym')) return 'Open Gym';
  
  return 'Other';
};

// Get color based on session type
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

// Format date string to readable format
const formatDate = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${weekdays[date.getDay()]}, ${day} de ${months[parseInt(month) - 1]}`;
};

// ========================================
// COMPONENT
// ========================================

const ScheduleTable: React.FC = () => {
  // Set to true to see all data, false to filter by current time
  const SHOW_ALL_DATA = false;
  
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDateString());

  // Update time every 30 seconds to keep data current
  useEffect(() => {
    // Update immediately on mount
    setCurrentTime(getCurrentTimeString());
    setCurrentDate(getCurrentDateString());
    
    // Then update every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
      setCurrentDate(getCurrentDateString());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Type assertion for imported JSON data
  const typedCheckinData = checkinData as CheckinData;

  // Process and filter data based on current time
  const processedData = useMemo<ProcessedSession[]>(() => {
    if (!typedCheckinData?.dates) return [];

    const sessions: ProcessedSession[] = [];

    // If showing all data, iterate through all dates, otherwise just current date
    const datesToProcess = SHOW_ALL_DATA 
      ? Object.keys(typedCheckinData.dates)
      : [currentDate];

    datesToProcess.forEach((dateKey) => {
      const dateData = typedCheckinData.dates[dateKey];
      if (!dateData) return;

      // Iterate through all classes for this date
      Object.entries(dateData.classes).forEach(([className, classData]) => {
        const timeRange = extractTimeRange(className);
        
        if (!timeRange) return;

        // Only filter by time if SHOW_ALL_DATA is false
        if (!SHOW_ALL_DATA && !isTimeInRange(timeRange.startTime, timeRange.endTime, currentTime)) {
          return;
        }

        const sessionType = getSessionType(className);
        
        // Extract clean class name (remove AM/PM time if present)
        let cleanClassName = className.split(' - ')[0];
        // Remove time patterns like "6:00 am" or "7:00 pm" from class name
        cleanClassName = cleanClassName.replace(/\d{1,2}:\d{2}\s*(am|pm)/gi, '').trim();
        
        sessions.push({
          id: `${classData.classId}-${dateKey}`,
          time: `${timeRange.startTime} - ${timeRange.endTime}`,
          date: formatDate(dateKey),
          sessionType,
          className: cleanClassName || className.split(' - ')[0],
          capacity: classData.limite,
          reservations: classData.reservations,
          reservationsCount: classData.totalReservations,
          color: getColor(sessionType),
          classId: classData.classId
        });
      });
    });

    // Sort by date first, then by start time
    return sessions.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
  }, [typedCheckinData, currentDate, currentTime]);

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

  return (
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
  );
};

export default ScheduleTable;