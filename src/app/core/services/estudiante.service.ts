import { Injectable } from '@angular/core';
<<<<<<< HEAD
import { HttpClient, HttpHeaders  } from '@angular/common/http';
=======
import { HttpClient } from '@angular/common/http';
>>>>>>> 50a2a9389529c64fd9e7945ea33da460fb80c3c7
import { Observable } from 'rxjs';
import { FormularioRegistroEstudiante, RespuestaRegistroEstudiante } from '../../interfaces/estudiante.interface';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private apiUrl = 'http://localhost:3000/estudiante';

  constructor(private http: HttpClient) {}

<<<<<<< HEAD
  obtenerMisUnidades(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/unidades`, this.getAuthHeaders());
}

obtenerUnidadAsignada(unidadId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/unidades/${unidadId}`, this.getAuthHeaders());
}


  // helper para auth headers (usar la función que ya tengas o repetir)
  private getAuthHeaders(): { headers: HttpHeaders } {
  const token = localStorage.getItem('auth_token') || '';
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  return { headers };
}

=======
>>>>>>> 50a2a9389529c64fd9e7945ea33da460fb80c3c7
  /**
   * Registrar un nuevo estudiante
   */
  registrarEstudiante(datosEstudiante: FormularioRegistroEstudiante): Observable<RespuestaRegistroEstudiante> {
    return this.http.post<RespuestaRegistroEstudiante>(`${this.apiUrl}/registrar`, datosEstudiante);
  }
}
