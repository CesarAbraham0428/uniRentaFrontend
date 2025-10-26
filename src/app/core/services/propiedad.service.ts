import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PropiedadNueva,
  FormularioRegistroPropiedad,
  ApiResponse,
  SinglePropertyResponse,
  Unidad,
  FormularioRegistroUnidad,
  FormularioActualizacionUnidad,
  UnidadesResponse,
  SingleUnidadResponse,
  PropiedadesRenteroResponse
} from '../../interfaces/propiedad.interface';

@Injectable({
  providedIn: 'root'
})
export class PropiedadService {
  private apiUrl = 'http://localhost:3000/propiedades';

  constructor(private http: HttpClient) { }

  // ========== ENDPOINTS PÚBLICOS ==========

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

  // ========== ENDPOINTS AUTENTICADOS ==========

  registrarPropiedad(datosPropiedad: FormularioRegistroPropiedad, archivo: File, tipoDocumentoId?: number): Observable<FormularioRegistroPropiedad> {
    const formData = new FormData();

    // Agregar campos individuales
    formData.append('nombre', datosPropiedad.nombre);
    formData.append('rentero_id', datosPropiedad.rentero_id.toString());

    // Agregar ubicacion como JSON string
    formData.append('ubicacion', JSON.stringify(datosPropiedad.ubicacion));

    // Agregar el archivo
    formData.append('documento', archivo, archivo.name);

    // Agregar tipo_id - usar el valor proporcionado o 1 por defecto
    const tipoId = tipoDocumentoId && tipoDocumentoId > 0 ? tipoDocumentoId : 1;
    formData.append('tipo_id', tipoId.toString());

    // Usar headers específicos para FormData
    const headers = this.getMultipartAuthHeaders();

    return this.http.post<FormularioRegistroPropiedad>(`${this.apiUrl}/registrar`, formData, { headers });
  }

  obtenerPropiedadesDelRentero(): Observable<PropiedadesRenteroResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<PropiedadesRenteroResponse>(`${this.apiUrl}/rentero/mis-propiedades`, { headers });
  }

  // ========== GESTIÓN DE UNIDADES ==========

  registrarUnidad(datosUnidad: FormularioRegistroUnidad): Observable<SingleUnidadResponse> {
    const headers = this.getAuthHeaders();

    // ✅ CAMBIO PRINCIPAL: Enviar objetos directamente, NO como strings JSON
    const payload = {
      propiedad_id: datosUnidad.propiedad_id,
      precio: datosUnidad.precio,
      descripcion: datosUnidad.descripcion,  // ← QUITAR JSON.stringify()
      imagenes: datosUnidad.imagenes         // ← QUITAR JSON.stringify()
    };

    console.log('🔍 Payload enviado al backend:', payload);
    return this.http.post<SingleUnidadResponse>(`${this.apiUrl}/unidades/registrar`, payload, { headers });
  }

  obtenerUnidadesPorPropiedad(propiedadId: number): Observable<UnidadesResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<UnidadesResponse>(`${this.apiUrl}/unidades/propiedad/${propiedadId}`, { headers });
  }

  actualizarUnidad(unidadId: number, datosActualizacion: FormularioActualizacionUnidad): Observable<SingleUnidadResponse> {
    const headers = this.getAuthHeaders();

    const payload: any = {};

    if (datosActualizacion.precio !== undefined) {
      payload.precio = datosActualizacion.precio;
    }

    if (datosActualizacion.descripcion !== undefined) {
      payload.descripcion = datosActualizacion.descripcion;  // ← QUITAR JSON.stringify()
    }

    if (datosActualizacion.imagenes !== undefined) {
      payload.imagenes = datosActualizacion.imagenes;        // ← QUITAR JSON.stringify()
    }

    if (datosActualizacion.disponible !== undefined) {
      payload.disponible = datosActualizacion.disponible;
    }

    return this.http.put<SingleUnidadResponse>(`${this.apiUrl}/unidades/${unidadId}`, payload, { headers });
  }

  eliminarUnidad(unidadId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/unidades/${unidadId}`, { headers });
  }

  // ========== MÉTODOS AUXILIARES ==========

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('rentero_token') || sessionStorage.getItem('rentero_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getMultipartAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('rentero_token') || sessionStorage.getItem('rentero_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No incluir Content-Type para FormData - el navegador lo establece automáticamente
    });
  }
}
