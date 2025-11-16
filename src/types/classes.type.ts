export interface ClassesInterface{
    nombre:string;
    hora_inicio:string;
    hora_fin:string;
    clase_id:number;
    dias_clases_id:number;
    clase_online:number;
}
export interface ClassesInterfaceApiResponse{
    success:boolean;
    clases:ClassesInterface[];
}