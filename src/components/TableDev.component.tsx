import React from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel
} from '@tanstack/react-table';
//import tavrosLogo from '../../public/tavros-logo.png';

// Import your JSON data
import calendar_data_23_11 from '../data/calendar_data_23_11_2025.json';

// Types
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
  asistencia_confirmada?: number;
  pago_pendiente: boolean;
  form_asistencia_url: boolean;
  mostrar_formulario: boolean;
  rating: string | null;
  imagen: string;
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
    className: 'Sesión',
    capacity: classData.limite,
    reservations: classData.reservations,
    reservationsCount: classData.totalReservations,
    color: '#10b981'
  };

  const columnHelper = createColumnHelper<Reservation>();

  const columns = [
    columnHelper.accessor('name', {
      header: 'Cliente',
      cell: (info) => (
        <div
          style={{
            fontSize: '20px',
            color: '#F5F5F5',
            fontWeight: '600'
          }}
        >
          {info.row.original.name} {info.row.original.last_name}
        </div>
      )
    }),
    columnHelper.accessor('nombre_plan', {
      header: 'Tipo de Sesión',
      cell: (info) => (
        <div
          style={{
            fontSize: '20px',
            color: '#F5F5F5',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          {info.getValue() || 'N/A'}
        </div>
      )
    }),
    columnHelper.accessor('asistencia_confirmada', {
      header: 'Asistencia Confirmada',
      cell: (info) => (
        <div
          style={{
            fontSize: '20px',
            color: '#F5F5F5',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          {info.getValue() === 1 ? 'Confirmada' : 'No confirmada'}
        </div>
      )
    })
  ];

  const table = useReactTable({
    columns,
    data: sessionData.reservations,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        padding: '32px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '4px solid #E8B44F'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: '900',
              color: '#E8B44F',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            Sesiones
          </h1>
       {/*    <img 
            src={typeof tavrosLogo === 'string' ? tavrosLogo : tavrosLogo.src} 
            alt="Tavros Logo"
            style={{
              height: '80px',
              width: 'auto',
              background:"transparent",
              backgroundColor:"transparent"
            }}
          /> */}
        </div>
        <div style={{ fontSize: '32px', color: '#D4D4D4', fontWeight: '600', marginTop: '8px' }}>
          {sessionData.date}
        </div>
        <div style={{ fontSize: '28px', color: '#B8B8B8', fontWeight: '600', marginTop: '8px' }}>
          {sessionData.time} • {sessionData.reservationsCount}/{sessionData.capacity} reservas
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid #E8B44F',
          overflow: 'hidden'
        }}
      >
        {sessionData.reservations.length === 0 ? (
          <div
            style={{
              padding: '64px',
              textAlign: 'center',
              fontSize: '24px',
              color: '#B8B8B8',
              fontStyle: 'italic'
            }}
          >
            Sin reservas
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{
                    borderBottom: '4px solid #E8B44F',
                    backgroundColor: '#1a1a1a'
                  }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        padding: '32px 24px',
                        textAlign: header.id === 'asistencia_confirmada' || header.id === 'nombre_plan' ? 'center' : 'left',
                        fontSize: '28px',
                        fontWeight: '900',
                        color: '#E8B44F',
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
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: index < table.getRowModel().rows.length - 1 ? '2px solid #3a3a3a' : 'none',
                    backgroundColor: '#2a2a2a'
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '24px',
                        color: '#F5F5F5',
                        verticalAlign: 'middle'
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TableDev;