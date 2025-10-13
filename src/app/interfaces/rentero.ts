export interface Rentero {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface FormularioRegistroRentero {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface RespuestaSubidaArchivo {
  exito: boolean;
  mensaje: string;
  rutaArchivo?: string;
}

export interface RespuestaRegistroRentero {
  exito: boolean;
  mensaje: string;
  rentero?: Rentero;
  errores?: string[];
}