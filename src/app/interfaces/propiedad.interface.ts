import { Rentero } from "./rentero.interface";

// Interfaz para la ubicación
export interface Ubicacion {
  nombre: string;
  direccion: string;
  calle: string;
  colonia: string;
  numero: string;
  codigo_postal: string;
  municipio: string | null;
  estado: string | null;
  coordenadas: {
    crs: {
      type: string;
      properties: {
        name: string;
      };
    };
    type: string;
    coordinates: number[];
  };
}

// Interfaz para la descripción
export interface Descripcion {
  terraza?: boolean;
  amueblado?: boolean;
  servicios?: string[];
  caracteristicas?: string;
  [key: string]: any;
}

// Interfaz principal de Propiedad
export interface Propiedad {
  id: number;
  nombre: string;
  precio: number;
  estado: string;
  descripcion: Descripcion;
  imagenes: string[];
  ubicacion: Ubicacion;
  rentero: Rentero;
}

// Interfaz para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  cantidad?: number;
  data?: Propiedad[];
  filtros?: any;
}

// Interfaz para una sola propiedad
export interface SinglePropertyResponse {
  success: boolean;
  data?: Propiedad;
}
