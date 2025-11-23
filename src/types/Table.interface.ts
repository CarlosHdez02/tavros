export interface Reservation {
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
export interface ClassData {
  class: string;
  classId: string;
  reservations: Reservation[];
  totalReservations: number;
  limite: number;
  clase_online: number;
  clase_coach_id: string | null;
  extractedAt: string;
}

export interface DateData {
  date: string;
  classes: Record<string, ClassData>;
  totalClasses: number;
  scrapedAt: string;
}
export interface CheckinData {
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
export type SessionType = 'Group' | 'Semi-Private' | 'Private' | 'Open Gym' | 'Other';

export interface ProcessedSession {
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
