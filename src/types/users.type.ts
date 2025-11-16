export type UserStatus = 'activo' | 'inactivo'
export interface UserInterface{
    name:string;
    fila:string;
    last_name:string;
    nombre_usuario:string | null;
    email:string;
    telefono:string;
    imagen:string;
    id:number;
    status: UserStatus;
    reserva_id:number,
    hash_reserva_id:string,
    canal:string;
    fecha_creacion:string;
    rating:unknown;
    forma_asistencia_url:boolean;
    mostrar_formulario:boolean;
    asistencia_confirmada:number;
    pago_pendiente:boolean
}
export interface UserInterfaceApiResponse{
    success:boolean;
    alumnos:UserInterface[];
}