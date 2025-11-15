import React, { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';
import calendarData from '../data/calendar_data_14_11_2025.json';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface ModalDetails {
  day?: string;
  className?: string;
  program?: string;
  capacity?: string | number;
  teachers?: string;
  startTime?: string;
  endTime?: string;
  trialClass?: string;
  onlineClass?: string;
  freeClass?: string;
  fullModalText?: string;
}

interface CalendarEvent {
  index: number;
  text: string;
  startTime: string | null;
  endTime: string | null;
  style: string;
  hasTime: boolean;
  modalDetails?: ModalDetails;
  filteredCoach?: string | null;
}

interface CalendarData {
  coach?: string | null;
  events: CalendarEvent[];
  totalEvents: number;
  pageTitle: string;
  url: string;
  scrapedAt: string;
}

interface ParsedModalDetails {
  day: string | null;
  className: string | null;
  program: string | null;
  capacity: number | null;
  teachers: string;
}

type SessionType = 'Group' | 'Semi-Private' | 'Private' | 'Open Gym' | 'Other';

interface ProcessedSession {
  id: number;
  time: string;
  day: string;
  sessionType: SessionType;
  className: string;
  capacity: number | string;
  coach: string;
  color: string;
  program: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Helper to decode HTML entities
const decodeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
};

// Parse modal details - now handles both old fullModalText and new clean structure
const parseModalDetails = (modalDetails: ModalDetails | undefined): ParsedModalDetails => {
  if (!modalDetails) {
    return {
      day: null,
      className: null,
      program: null,
      capacity: null,
      teachers: 'Staff'
    };
  }
  
  // If we have the new clean structure, use it directly
  if (modalDetails.day && !modalDetails.day.includes('\n')) {
    return {
      day: modalDetails.day,
      className: modalDetails.className || null,
      program: modalDetails.program || null,
      capacity: modalDetails.capacity ? parseInt(String(modalDetails.capacity)) : null,
      teachers: modalDetails.teachers || 'Staff'
    };
  }
  
  // Fallback: parse from fullModalText if available
  const fullText = modalDetails.fullModalText || modalDetails.day || '';
  const clean = fullText.replace(/\s+/g, ' ').trim();
  
  // Extract day - find first occurrence of weekday name
  const dayMatch = clean.match(/Día:\s*(\w+)|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo/i);
  const day = dayMatch ? dayMatch[1] || dayMatch[0] : null;
  
  // Extract class name
  const classMatch = clean.match(/Clase:\s*([^P]+?)(?=Programa|Hora)/i);
  const className = classMatch ? classMatch[1].trim() : null;
  
  // Extract program type
  const programMatch = clean.match(/Programa\s+([^H]+?)(?=Hora|$)/i);
  const program = programMatch ? programMatch[1].trim() : null;
  
  // Extract capacity
  const capacityMatch = clean.match(/Cupos[^:]*:\s*(\d+)/i);
  const capacity = capacityMatch ? parseInt(capacityMatch[1]) : null;
  
  // Extract teachers - clean up duplicates
  const teachersMatch = clean.match(/Profesores[^:]*:\s*([^S]+?)(?=Select|Sala|$)/i);
  let teachers = 'Staff';
  
  if (teachersMatch) {
    const raw = teachersMatch[1].trim();
    // Split by capital letters to separate names
    const names = raw.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || [];
    // Remove duplicates
    teachers = [...new Set(names)].join(', ') || 'Staff';
  }
  
  return { day, className, program, capacity, teachers };
};

// Determine session type from text and program
const getSessionType = (text: string, program: string | null): SessionType => {
  const decoded = decodeHtml(text).toLowerCase();
  const prog = (program || '').toLowerCase();
  
  if (prog.includes('grupal') || decoded.includes('grupal')) return 'Group';
  if (prog.includes('semiprivad') || decoded.includes('semiprivad')) return 'Semi-Private';
  if (prog.includes('privad') || decoded.includes('privad')) return 'Private';
  if (prog.includes('open gym')) return 'Open Gym';
  
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

// ========================================
// COMPONENT
// ========================================

const ScheduleTable: React.FC = () => {
  const [filterType, setFilterType] = useState<SessionType | 'all'>('all');
  const [filterDay, setFilterDay] = useState<string>('all');

  // Type assertion for imported JSON data
  const typedCalendarData = calendarData as any;

  // Process and transform the data
  const processedData = useMemo<ProcessedSession[]>(() => {
    if (!typedCalendarData?.events) return [];
    
    return typedCalendarData.events
      .filter((event:any): event is CalendarEvent & { startTime: string; endTime: string } => 
        Boolean(event.startTime && event.endTime)
      )
      .map((event:any, index:any): ProcessedSession => {
        const parsed = parseModalDetails(event.modalDetails);
        const sessionType = getSessionType(event.text, parsed.program);
        
        return {
          id: index,
          time: `${event.startTime} - ${event.endTime}`,
          day: parsed.day || 'N/A',
          sessionType,
          className: decodeHtml(parsed.className || event.text.split(/\d/)[0]),
          capacity: parsed.capacity || 'N/A',
          coach: parsed.teachers,
          color: getColor(sessionType),
          program: parsed.program || sessionType
        };
      })
      .sort((a:any, b:any) => {
        // Sort by time
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
  }, []);

  // Apply filters
  const filteredData = useMemo<ProcessedSession[]>(() => {
    let filtered = processedData;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.sessionType === filterType);
    }
    
    if (filterDay !== 'all') {
      filtered = filtered.filter(item => 
        item.day.toLowerCase() === filterDay.toLowerCase()
      );
    }
    
    return filtered;
  }, [processedData, filterType, filterDay]);

  // Get unique values for filters
  const sessionTypes = useMemo<SessionType[]>(() => 
    [...new Set(processedData.map(item => item.sessionType))].sort(),
    [processedData]
  );

  const days = useMemo<string[]>(() => 
    [...new Set(processedData.map(item => item.day))].filter(d => d !== 'N/A').sort(),
    [processedData]
  );

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
    columnHelper.accessor('day', {
      header: 'Day',
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
      header: 'Spots',
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
    columnHelper.accessor('coach', {
      header: 'Coach',
      cell: (info) => (
        <span style={{ 
          padding: '6px 12px',
          backgroundColor: '#334155',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          border: '1px solid #475569',
          whiteSpace: 'nowrap'
        }}>
          {info.getValue()}
        </span>
      )
    })
  ];

  const table = useReactTable({
    columns,
    data: filteredData,
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
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ 
                  textAlign: 'center', 
                  padding: '48px',
                  color: '#94a3b8',
                  fontSize: '16px'
                }}>
                  No sessions found
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