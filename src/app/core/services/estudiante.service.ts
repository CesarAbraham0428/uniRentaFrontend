import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormularioRegistroEstudiante, RespuestaRegistroEstudiante } from '../../interfaces/estudiante.interface';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private apiUrl = 'http://localhost:3000/estudiante';

  constructor(private http: HttpClient) {}

  /**
   * Registrar un nuevo estudiante
   */
  registrarEstudiante(datosEstudiante: FormularioRegistroEstudiante): Observable<RespuestaRegistroEstudiante> {
    return this.http.post<RespuestaRegistroEstudiante>(`${this.apiUrl}/registrar`, datosEstudiante);
  }
}
