'use client'
import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';

// Import your interfaces and helpers
import { CheckinData, ProcessedSession } from '@/types/Table.interface';
import { getCurrentDateString, getCurrentTimeString, extractTimeRange, getColor, getSessionType, formatDate } from '@/utils/helpers';

// Import your JSON data
import calendar_data_23_11 from '../../data/calendar_data_23_11_2025.json';

const TVScheduleDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDateString());
  const [checkinData] = useState<CheckinData | null>(calendar_data_23_11 as CheckinData);
  const [loading] = useState<boolean>(false); // Set to false since we have data
  const [error] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState<string>('24-11-2025'); // For testing specific dates

  // Wake lock to prevent screen from sleeping
  useEffect(() => {
    let wakeLock: any = null;
    
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake lock active');
        }
      } catch (err) {
        console.error('Wake lock error:', err);
      }
    };
    
    requestWakeLock();
    
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  // Log data on mount
  useEffect(() => {
    console.log('✅ Data loaded from import:', checkinData);
    console.log('Available dates:', Object.keys(checkinData?.dates || {}));
  }, []);

  // Update time every 30 seconds
  useEffect(() => {
    setCurrentTime(getCurrentTimeString());
    setCurrentDate(getCurrentDateString());
    
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
      setCurrentDate(getCurrentDateString());
    }, 30000);

    return () => clearInterval(timeInterval);
  }, []);

  // Process data - SHOWING ALL CLASSES (testing mode)
  const processedData = useMemo<ProcessedSession[]>(() => {
    if (!checkinData?.dates) {
      console.log('⚠️ No checkin data available');
      return [];
    }

    // Use manualDate for testing
    const dateToUse = manualDate || currentDate;
    
    console.log(`📅 Showing ALL classes for date: ${dateToUse}`);

    const sessions: ProcessedSession[] = [];
    const dateData = checkinData.dates[dateToUse];
    
    if (!dateData) {
      console.log(`❌ No data found for date: ${dateToUse}`);
      console.log('Available dates:', Object.keys(checkinData.dates));
      return [];
    }

    console.log(`📊 Processing ${Object.keys(dateData.classes).length} classes for ${dateToUse}`);

    Object.entries(dateData.classes).forEach(([className, classData]) => {
      const timeRange = extractTimeRange(className);
      
      if (!timeRange) {
        console.log(`⚠️ No time range found for class: ${className}`);
        return;
      }

      // ✅ TESTING MODE: Show ALL classes regardless of time
      console.log(`✅ Including class: ${timeRange.startTime}-${timeRange.endTime}`);

      const sessionType = getSessionType(className);
      
      let cleanClassName = className.split(' - ')[0];
      cleanClassName = cleanClassName.replace(/\d{1,2}:\d{2}\s*(am|pm)/gi, '').trim();
      
      sessions.push({
        id: `${classData.classId}-${dateToUse}`,
        time: `${timeRange.startTime} - ${timeRange.endTime}`,
        date: formatDate(dateToUse),
        sessionType,
        className: cleanClassName || className.split(' - ')[0],
        capacity: classData.limite,
        reservations: classData.reservations,
        reservationsCount: classData.totalReservations,
        color: getColor(sessionType),
        classId: classData.classId
      });
    });

    console.log(`✅ Showing ALL ${sessions.length} classes (TESTING MODE - no time filter)`);
    return sessions.sort((a, b) => a.time.localeCompare(b.time));
  }, [checkinData, currentDate, manualDate]); // Removed currentTime dependency

  const columnHelper = createColumnHelper<ProcessedSession>();

  const columns = [
    columnHelper.accessor('time', {
      header: 'Hora',
      cell: (info) => (
        <div style={{ 
          fontWeight: '900', 
          color: '#60a5fa',
          fontSize: '32px',
          whiteSpace: 'nowrap',
          letterSpacing: '1px'
        }}>
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('sessionType', {
      header: 'Tipo',
      cell: (info) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: info.row.original.color,
            border: '3px solid #0f172a',
            flexShrink: 0,
            boxShadow: `0 0 20px ${info.row.original.color}`
          }} />
          <span style={{ 
            fontWeight: '700', 
            fontSize: '26px',
            whiteSpace: 'nowrap',
            color: '#e2e8f0'
          }}>
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor('className', {
      header: 'Clase',
      cell: (info) => (
        <div style={{ 
          fontSize: '26px',
          fontWeight: '600',
          color: '#f1f5f9',
          whiteSpace: 'normal',
          lineHeight: '1.4'
        }}>
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('reservations', {
      header: 'Reservas',
      cell: (info) => {
        const reservations = info.getValue();
        const reservationsCount = info.row.original.reservationsCount;
        const capacity = info.row.original.capacity;
        
        if (reservations.length === 0) {
          return (
            <div style={{
              textAlign: 'center',
              fontWeight: '600',
              color: '#64748b',
              fontSize: '24px',
              fontStyle: 'italic'
            }}>
              Sin reservas
            </div>
          );
        }
        
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              textAlign: 'center',
              fontWeight: '900',
              color: '#fbbf24',
              fontSize: '32px',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '3px solid #475569',
              textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
            }}>
              {reservationsCount} / {capacity}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {reservations.map((reservation, idx) => (
                <div
                  key={reservation.id}
                  style={{
                    padding: '12px 16px',
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    backgroundColor: idx % 2 === 0 ? 'rgba(51, 65, 85, 0.5)' : 'transparent',
                    borderRadius: '8px'
                  }}
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '48px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '42px', 
            color: '#94a3b8',
            marginBottom: '32px',
            fontWeight: '700'
          }}>
            Cargando horario...
          </div>
          <div style={{
            width: '80px',
            height: '80px',
            border: '8px solid #334155',
            borderTop: '8px solid #60a5fa',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '48px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            color: '#ef4444',
            marginBottom: '24px',
            fontWeight: '900'
          }}>
            ⚠️ Error
          </div>
          <div style={{ 
            fontSize: '28px', 
            color: '#94a3b8',
            fontWeight: '600',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Testing Controls - Remove for production */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        backgroundColor: '#1e293b',
        padding: '16px',
        borderRadius: '12px',
        border: '2px solid #334155',
        zIndex: 1000
      }}>
        <div style={{ 
          color: '#fbbf24', 
          fontSize: '16px', 
          marginBottom: '8px',
          fontWeight: '700'
        }}>
          🧪 TESTING MODE
        </div>
        <div style={{ 
          color: '#94a3b8', 
          fontSize: '12px', 
          marginBottom: '12px'
        }}>
          Showing ALL classes (no time filter)
        </div>
        <select
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          style={{
            padding: '8px',
            fontSize: '14px',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: '1px solid #334155',
            borderRadius: '6px',
            width: '140px'
          }}
        >
          {checkinData && Object.keys(checkinData.dates).map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div style={{
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '4px solid #1e40af'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '900',
              color: '#f1f5f9',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Horario Actual
            </h1>
            <div style={{
              fontSize: '32px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>
              {formatDate(manualDate || currentDate)}
            </div>
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '72px',
              fontWeight: '900',
              color: '#60a5fa',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(96, 165, 250, 0.5)'
            }}>
              {currentTime}
            </div>
            <div style={{
              fontSize: '24px',
              color: '#64748b',
              marginTop: '8px',
              fontWeight: '600'
            }}>
              {processedData.length} clase{processedData.length !== 1 ? 's' : ''} activa{processedData.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '24px', 
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '2px solid #334155',
        overflow: 'hidden'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse'
        }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ 
                borderBottom: '4px solid #475569', 
                backgroundColor: '#0f1419' 
              }}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id}
                    style={{ 
                      padding: '32px 24px',
                      textAlign: 'left',
                      fontSize: '28px',
                      fontWeight: '900',
                      color: '#60a5fa',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
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
                <td colSpan={4} style={{ 
                  textAlign: 'center', 
                  padding: '120px 48px',
                  color: '#64748b',
                  fontSize: '36px',
                  fontWeight: '700'
                }}>
                  No hay clases para esta fecha
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <tr 
                  key={row.id}
                  style={{ 
                    borderBottom: '2px solid #334155',
                    backgroundColor: index % 2 === 0 ? '#1e293b' : '#1a1f2e'
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id}
                      style={{ 
                        padding: '32px 24px',
                        color: '#e4e9f1',
                        verticalAlign: 'top'
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

      {/* Debug Info */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        fontSize: '14px',
        color: '#64748b',
        fontFamily: 'monospace'
      }}>
        <div style={{ color: '#fbbf24', fontWeight: '700', marginBottom: '8px' }}>
          🧪 TESTING MODE - Showing ALL classes (no time filter)
        </div>
        <div>📅 Viewing Date: {manualDate}</div>
        <div>⏰ Current Time: {currentTime} (ignored in testing mode)</div>
        <div>📊 Total Classes Showing: {processedData.length}</div>
        <div>💾 Available Dates: {checkinData ? Object.keys(checkinData.dates).join(', ') : 'None'}</div>
      </div>
    </div>
  );
};

export default TVScheduleDisplay;