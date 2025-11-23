import React from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender, getSortedRowModel } from '@tanstack/react-table';

// Import your JSON data
import calendar_data_23_11 from '../data/calendar_data_23_11_2025.json'

// Types
interface Reservation {
  id: number;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
}

interface ProcessedSession {
  id: string;
  time: string;
  date: string;
  sessionType: string;
  className: string;
  capacity: number;
  reservations: Reservation[];
  reservationsCount: number;
  color: string;
}

const TableDev = () => {
  // Get the 7pm class from 24-11-2025
  const dateData = calendar_data_23_11.dates['24-11-2025'];
  const classData = dateData.classes['Sesión grupal 7:00 pm - 19:00 a 20:00 - Presencial'];

  // Format the data for display
  const sessionData: ProcessedSession = {
    id: classData.classId,
    time: '19:00 - 20:00',
    date: 'Lunes, 24 de noviembre',
    sessionType: 'Group',
    className: 'Sesión grupal',
    capacity: classData.limite,
    reservations: classData.reservations,
    reservationsCount: classData.totalReservations,
    color: '#10b981'
  };

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
    data: [sessionData], // Single row
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
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
              {sessionData.date}
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
              19:30
            </div>
            <div style={{
              fontSize: '24px',
              color: '#64748b',
              marginTop: '8px',
              fontWeight: '600'
            }}>
              1 clase activa
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
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id}
                style={{ 
                  borderBottom: '2px solid #334155',
                  backgroundColor: '#1e293b'
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableDev;