import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropiedadNueva, FormularioRegistroPropiedad, ApiResponse, SinglePropertyResponse } from '../../interfaces/propiedad.interface';

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

registrarPropiedad(datosPropiedad: FormularioRegistroPropiedad, archivo: File, tipoDocumentoId?: number): Observable<FormularioRegistroPropiedad> {
  const formData = new FormData();

  // Agregar campos individuales
  formData.append('nombre', datosPropiedad.nombre);
  formData.append('rentero_id', datosPropiedad.rentero_id.toString());
  
  // Agregar ubicacion como JSON string
  formData.append('ubicacion', JSON.stringify(datosPropiedad.ubicacion));
  
  // Agregar el archivo
  formData.append('documento', archivo, archivo.name);
  
  // Agregar tipo_id
  formData.append('tipo_id', tipoDocumentoId?.toString() || '1');

  return this.http.post<FormularioRegistroPropiedad>(`${this.apiUrl}/registrar`, formData);
}
}
