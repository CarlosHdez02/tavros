import React, { useState, useEffect, useMemo } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel
} from '@tanstack/react-table';
import tavrosLogo from '../../public/WhatsApp_Image_2025-12-01_at_16.46.37-removebg-preview.png';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tavros-scraper-1.onrender.com';

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

interface ClassData {
  classId: string;
  limite: number;
  totalReservations: number;
  reservations: Reservation[];
}

interface DateData {
  classes: {
    [key: string]: ClassData;
  };
}

interface CheckinData {
  dates: {
    [key: string]: DateData;
  };
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

const TVScheduleDisplay = () => {
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchCheckinData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/checkin`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CheckinData = await response.json();
      setCheckinData(data);
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    fetchCheckinData();
    
    const dataRefreshInterval = setInterval(() => {
      fetchCheckinData();
    }, 5 * 60 * 1000);

    return () => clearInterval(dataRefreshInterval);
  }, []);

  // Keep server awake
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/health`);
      } catch (e) {
        console.log('Keep-alive ping failed');
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);

  // Process session data
  const sessionData: ProcessedSession | null = useMemo(() => {
    if (!checkinData?.dates) return null;

    const dateData = checkinData.dates['24-11-2025'];
    if (!dateData) return null;

    const classData = dateData.classes['Sesión grupal 7:00 pm - 19:00 a 20:00 - Presencial'];
    if (!classData) return null;

    return {
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
  }, [checkinData]);

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
    data: sessionData?.reservations || [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  if (loading && !checkinData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          padding: '48px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '42px',
              color: '#E8B44F',
              marginBottom: '32px',
              fontWeight: '700'
            }}
          >
            Cargando datos...
          </div>
          <div
            style={{
              width: '80px',
              height: '80px',
              border: '8px solid #3a3a3a',
              borderTop: '8px solid #E8B44F',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          padding: '48px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '48px',
              color: '#ef4444',
              marginBottom: '24px',
              fontWeight: '900'
            }}
          >
            ⚠️ Error
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#B8B8B8',
              fontWeight: '600'
            }}
          >
            No se pudo cargar los datos
          </div>
          <button
            onClick={fetchCheckinData}
            style={{
              marginTop: '32px',
              padding: '16px 32px',
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a',
              backgroundColor: '#E8B44F',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          padding: '48px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '36px',
              color: '#B8B8B8',
              fontWeight: '700'
            }}
          >
            No hay datos disponibles para esta sesión
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
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
          <img 
            src={typeof tavrosLogo === 'string' ? tavrosLogo : tavrosLogo.src} 
            alt="Tavros Logo"
            style={{
              height: '120px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
        <div style={{ fontSize: '32px', color: '#D4D4D4', fontWeight: '600', marginTop: '8px' }}>
          {sessionData.date}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ fontSize: '28px', color: '#B8B8B8', fontWeight: '600' }}>
            {sessionData.time}
          </div>
          <div style={{ fontSize: '28px', color: '#B8B8B8', fontWeight: '600' }}>
            {sessionData.reservationsCount}/{sessionData.capacity} reservas
          </div>
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

export default TVScheduleDisplay;