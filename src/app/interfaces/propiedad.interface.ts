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

export interface PropiedadBackend {
  id: number;
  nombre: string;
  calle: string;
  colonia: string;
  numero: string;
  municipio: string;
  visible?: boolean; // Si viene del backend
}

export interface UbicacionNueva {
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

export interface PropiedadNueva {
  id: number;
  rentero_id: number;
  nombre: string;
  ubicacion: UbicacionNueva;
  visible: boolean;
}

export interface FormularioRegistroPropiedad {
  nombre: string;
  ubicacion: Ubicacion;
  rentero_id: number;
}

// Nuevas interfaces para unidades
export interface Unidad {
  id: number;
  propiedad_id: number;
  precio: number;
  descripcion: Descripcion;
  imagenes: string[];
  disponible: boolean;
  created_at?: string;
  updated_at?: string;
  propiedad?: Propiedad;
}

export interface FormularioRegistroUnidad {
  propiedad_id: number;
  precio: number;
  descripcion: Descripcion;
  imagenes: string[];
}

export interface FormularioActualizacionUnidad {
  precio?: number;
  descripcion?: Descripcion;
  imagenes?: string[];
  disponible?: boolean;
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

// Nuevas interfaces para respuestas de unidades
export interface UnidadesResponse {
  success: boolean;
  cantidad?: number;
  data?: Unidad[];
}

export interface SingleUnidadResponse {
  success: boolean;
  data?: Unidad;
}

// Interfaz para propiedades del rentero
export interface PropiedadesRenteroResponse {
  success: boolean;
  cantidad?: number;
  data?: PropiedadBackend[]; // Cambia de PropiedadNueva[] a PropiedadBackend[]
}
