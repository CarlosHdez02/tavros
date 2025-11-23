import React from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel
} from '@tanstack/react-table';

// Import your JSON data
import calendar_data_23_11 from '../data/calendar_data_23_11_2025.json';

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
  // Get data
  const dateData = calendar_data_23_11.dates['24-11-2025'];
  const classData =
    dateData.classes[
      'Sesión grupal 7:00 pm - 19:00 a 20:00 - Presencial'
    ];

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
        <div
          style={{
            fontWeight: '900',
            color: '#60a5fa',
            fontSize: '32px',
            whiteSpace: 'nowrap',
            letterSpacing: '1px'
          }}
        >
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('sessionType', {
      header: 'Tipo',
      cell: (info) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: info.row.original.color,
              border: '3px solid #0f172a',
              boxShadow: `0 0 20px ${info.row.original.color}`
            }}
          />
          <span
            style={{
              fontWeight: '700',
              fontSize: '26px',
              whiteSpace: 'nowrap',
              color: '#e2e8f0'
            }}
          >
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor('className', {
      header: 'Clase',
      cell: (info) => (
        <div
          style={{
            fontSize: '26px',
            fontWeight: '600',
            color: '#f1f5f9'
          }}
        >
          {info.getValue()}
        </div>
      )
    }),
    columnHelper.accessor('reservationsCount', {
      header: 'Reservas',
      cell: (info) => {
        const { reservationsCount, capacity } = info.row.original;
        return (
          <div
            style={{
              fontSize: '26px',
              fontWeight: '700',
              color: '#fbbf24',
              textAlign: 'center'
            }}
          >
            {reservationsCount} / {capacity}
          </div>
        );
      }
    })
  ];

  const table = useReactTable({
    columns,
    data: [sessionData],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        padding: '32px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '4px solid #1e40af'
        }}
      >
        <h1
          style={{
            fontSize: '56px',
            fontWeight: '900',
            color: '#f1f5f9',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          Horario Actual
        </h1>
        <div style={{ fontSize: '32px', color: '#94a3b8', fontWeight: '600' }}>
          {sessionData.date}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid #334155',
          overflow: 'hidden'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  borderBottom: '4px solid #475569',
                  backgroundColor: '#0f1419'
                }}
              >
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
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => {
              const { reservations, reservationsCount, capacity } =
                row.original;

              return (
                <React.Fragment key={row.id}>
                  {/* Main row */}
                  <tr
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Second row for reservations */}
                  <tr>
                    <td colSpan={row.getVisibleCells().length}>
                      <div
                        style={{
                          padding: '24px 0',
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        {reservations.length === 0 ? (
                          <div
                            style={{
                              fontSize: '24px',
                              color: '#64748b',
                              fontStyle: 'italic'
                            }}
                          >
                            Sin reservas
                          </div>
                        ) : (
                          <table
                            style={{
                              margin: '0 auto',
                              borderCollapse: 'collapse',
                             
                              borderRadius: '12px',
                              overflow: 'hidden',
                              minWidth: '60%',
                              maxWidth: '80%'
                            }}
                          >
                            <thead>
                              <tr style={{ }}>
                                <th
                                  style={{
                                    padding: '12px',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#60a5fa',
                                    textAlign: 'center'
                                  }}
                                >
                                  Reservados ({reservationsCount}/{capacity})
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {reservations.map((r, i) => (
                                <tr
                                  key={r.id}
                                  style={{
                                    background:
                                      i % 2 === 0
                                        ? 'transparent'
                                        : 'transparent'
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: '12px',
                                      fontSize: '20px',
                                      color: '#f1f5f9',
                                      fontWeight: '600',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {r.name} {r.last_name}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableDev;
