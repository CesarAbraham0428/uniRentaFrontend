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
  SingleUnidadCompletaResponse,
  SingleUnidadResponse,
  RegistroUnidadResponse,
  EliminacionUnidadResponse,
  PropiedadesRenteroResponse,
  ErrorResponse
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

  // ========== ENDPOINTS AUTENTICADOS - PROPIEDADES ==========

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

  // ========== GESTIÓN DE UNIDADES (MÉTODOS CORREGIDOS) ==========

  registrarUnidad(datosUnidad: FormularioRegistroUnidad): Observable<RegistroUnidadResponse> {
    console.log('🚀 Enviando datos de unidad al backend:', datosUnidad);

    // Validar datos antes de enviar
    if (!datosUnidad.propiedad_id) {
      throw new Error('propiedad_id es requerido');
    }

    if (!datosUnidad.precio || datosUnidad.precio <= 0) {
      throw new Error('precio debe ser mayor a 0');
    }

    if (!datosUnidad.nombre || datosUnidad.nombre.trim() === '') {
      throw new Error('nombre es requerido');
    }

    // Construir el payload según lo que espera tu backend
    const payload = {
      propiedad_id: Number(datosUnidad.propiedad_id),
      nombre: datosUnidad.nombre.trim(),
      precio: Number(datosUnidad.precio),
      descripcion: datosUnidad.descripcion || null,
      imagenes: datosUnidad.imagenes || null
    };

    console.log('📤 Payload final para el backend:', payload);

    return this.http.post<RegistroUnidadResponse>(
      `${this.apiUrl}/unidades/registrar`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  eliminarUnidad(unidadId: number): Observable<EliminacionUnidadResponse> {
    console.log('🗑️ Eliminando unidad ID:', unidadId);

    if (!unidadId || isNaN(unidadId)) {
      throw new Error('ID de unidad inválido');
    }

    return this.http.delete<EliminacionUnidadResponse>(
      `${this.apiUrl}/unidades/${unidadId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  actualizarUnidad(unidadId: number, datos: FormularioActualizacionUnidad): Observable<SingleUnidadResponse> {
    console.log('✏️ Actualizando unidad ID:', unidadId, 'con datos:', datos);

    if (!unidadId || isNaN(unidadId)) {
      throw new Error('ID de unidad inválido');
    }

    // Construir payload para actualización
    const payload: any = {};

    if (datos.nombre && datos.nombre.trim()) payload.nombre = datos.nombre.trim();
    if (datos.precio !== undefined && datos.precio > 0) payload.precio = Number(datos.precio);
    if (datos.estado) payload.estado = datos.estado;
    if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
    if (datos.imagenes !== undefined) payload.imagenes = datos.imagenes;

    console.log('📤 Payload de actualización:', payload);

    return this.http.put<SingleUnidadResponse>(
      `${this.apiUrl}/unidades/${unidadId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  obtenerUnidadesPorPropiedad(propiedadId: number): Observable<UnidadesResponse> {
    console.log('📋 Obteniendo unidades para propiedad ID:', propiedadId);

    if (!propiedadId || isNaN(propiedadId)) {
      throw new Error('ID de propiedad inválido');
    }

    return this.http.get<UnidadesResponse>(
      `${this.apiUrl}/unidades/propiedad/${propiedadId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  obtenerUnidadCompletaPorId(unidadId: number): Observable<SingleUnidadCompletaResponse> {
    console.log('🔍 Obteniendo unidad completa ID:', unidadId);

    if (!unidadId || isNaN(unidadId)) {
      throw new Error('ID de unidad inválido');
    }

    return this.http.get<SingleUnidadCompletaResponse>(
      `${this.apiUrl}/unidades/${unidadId}`,
      { headers: this.getAuthHeaders() }
    );
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

  // ========== MÉTODOS DE UTILIDAD PARA MANEJO DE ERRORES ==========

  /**
   * Verifica si una respuesta es un error
   */
  esError(response: any): response is ErrorResponse {
    return response && typeof response.error === 'string';
  }

  /**
   * Extrae el mensaje de error de una respuesta
   */
  obtenerMensajeError(error: any): string {
    if (error?.error?.mensaje) {
      return error.error.mensaje;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.error?.error) {
      return error.error.error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Ha ocurrido un error inesperado';
  }

  // ========== MÉTODOS DE UTILIDAD PARA UNIDADES (NUEVOS) ==========

  /**
   * Convierte el estado del backend a disponibilidad para el frontend
   */
  estadoADisponible(estado: string): boolean {
    return estado === 'libre';
  }

  /**
   * Convierte disponibilidad del frontend a estado para el backend
   */
  disponibleAEstado(disponible: boolean): string {
    return disponible ? 'libre' : 'ocupada';
  }

  /**
   * Formatea el texto del estado para mostrar al usuario
   */
  formatearEstado(estado: string): string {
    switch (estado) {
      case 'libre':
        return 'Disponible';
      case 'ocupada':
        return 'Ocupada';
      case 'mantenimiento':
        return 'En Mantenimiento';
      default:
        return 'Estado Desconocido';
    }
  }
}
