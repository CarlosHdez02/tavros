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
  asistencia_confirmada?: number;
  pago_pendiente: boolean;
  form_asistencia_url: boolean;
  mostrar_formulario: boolean;
  rating: string | null;
  imagen: string;
}

export interface ClassData {
  classId: string;
  class?: string;
  limite: number;
  totalReservations?: number;
  reservations: Reservation[];
  clase_coach_id?: string | null;
  clase_online?: number;
  extractedAt?: string;
}

export interface CheckinData {
  data: {
    classes: {
      [key: string]: ClassData;
    };
    date: string;
    scrapedAt: string;
    totalClasses: number;
  };
  date: string;
}

export interface ProcessedSession {
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
export const PLAN_MAPPING: { [key: string]: string } = {
  "Paquete Semestral (Grupal)": "Grupal",
  "Fernanda Vázquez": "Grupal",
  "Paquete Semestral Semiprivadas + Inscripción": "Semiprivada",
  "Online Coaching (Suscripción)": "Online",
  "Paquete Semestral: Online Coaching + Open Gym": "Grupal",
  "Online Coaching + Open Gym": "Grupal",
  "Grupal Paquete Trimestral + Inscripción": "Grupal",
  "Paquete Semestral Héctor Vielma Paredes": "Privada",
  "Paquete Semestral Cinthya Paredes": "Grupal",
  "Paquete familiar Grupal Full (4 personas)": "Grupal",
  "Online Coaching Premium": "Online",
  "Paquete semestral": "Grupal",
  "Paquete Trimestral Semiprivadas": "Semiprivada",
  "Online Coaching": "Online",
  "Open Gym": "Open gym",
  "Grupal (2 sesiones/semanales)": "Grupal",
  "Paquete de sesiones Semiprivadas": "Semiprivada",
  "Paquete de sesiones Privadas": "Privada",
  "Paquete Trimestral": "Grupal",
  "Grupal (Paquete Full)": "Grupal",
  "Plan trimestral en sesiones grupales + inscripción": "Grupal",
  "Paquete Trimestral Grupal + Inscripción: Pago en dos exhibiciones ": "Grupal",
  "Paquete Trimestral Grupal (Plan Actual)": "Grupal",
  "Grupal (Mensual)": "Grupal",
};

// Types
