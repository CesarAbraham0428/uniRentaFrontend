import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormularioRegistroRentero, RespuestaRegistroRentero } from '../../interfaces/rentero';

@Injectable({
  providedIn: 'root'
})
export class RenteroService {
  private apiUrl = 'http://localhost:3000/rentero';

  constructor(private http: HttpClient) { }

  registrarRentero(datosRentero: FormularioRegistroRentero, archivo: File): Observable<RespuestaRegistroRentero> {
    const formData = new FormData();
    
    // Agregar los campos del formulario al FormData
    Object.keys(datosRentero).forEach(key => {
      formData.append(key, datosRentero[key as keyof FormularioRegistroRentero]);
    });
    
    formData.append('documento', archivo, archivo.name);
    formData.append('tipo', 'ine'); 
    
    return this.http.post<RespuestaRegistroRentero>(`${this.apiUrl}/registrar`, formData);
  }
}