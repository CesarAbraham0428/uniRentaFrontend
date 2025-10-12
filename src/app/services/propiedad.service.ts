import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

// Interfaz para el rentero
export interface Rentero {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
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

@Injectable({
  providedIn: 'root'
})
export class PropiedadService {
  private apiUrl = 'http://localhost:3000/propiedades';

  constructor(private http: HttpClient) { }

  obtenerPropiedades(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  obtenerPropiedadPorId(id: number): Observable<SinglePropertyResponse> {
    return this.http.get<SinglePropertyResponse>(`${this.apiUrl}/${id}`);
  }

  filtrarPropiedades(filtros: {
    precioMin?: number;
    precioMax?: number;
    colonia?: string;
    municipio?: string;
    universidadId?: number;
    universidadNombre?: string;
    rangoKm?: number;
  }): Observable<ApiResponse> {
    let params = new HttpParams();

    if (filtros.precioMin !== undefined && filtros.precioMin !== null) {
      params = params.set('precioMin', filtros.precioMin.toString());
    }
    if (filtros.precioMax !== undefined && filtros.precioMax !== null) {
      params = params.set('precioMax', filtros.precioMax.toString());
    }
    if (filtros.colonia) {
      params = params.set('colonia', filtros.colonia);
    }
    if (filtros.municipio) {
      params = params.set('municipio', filtros.municipio);
    }
    if (filtros.universidadId) {
      params = params.set('universidadId', filtros.universidadId.toString());
    }
    if (filtros.universidadNombre) {
      params = params.set('universidadNombre', filtros.universidadNombre);
    }
    if (filtros.rangoKm) {
      params = params.set('rangoKm', filtros.rangoKm.toString());
    }

    return this.http.get<ApiResponse>(`${this.apiUrl}/filtrar`, { params });
  }
}
