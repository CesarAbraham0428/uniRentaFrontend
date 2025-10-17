import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class DocumentoValidacionService {
  constructor(private toastr: ToastrService) {}

  /**
   * Valida si el archivo es de un tipo permitido (imagen o PDF).
   */
  validarTipoDocumento(archivo: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.toastr.error('Tipo de archivo no permitido. Use imágenes (JPEG, PNG, GIF) o PDF.', 'Error de validación');
      return false;
    }
    return true;
  }

  /**
   * Procesa errores comunes del backend y muestra mensajes apropiados.
   * Asume que el backend devuelve errores estándar como campos faltantes.
   */
  manejarErrores(error: any, contexto: string = 'operación'): void {
    let mensaje = 'Error desconocido';
    if (error.error?.mensaje) {
      mensaje = error.error.mensaje;
    } else if (error.message) {
      mensaje = error.message;
    }
    this.toastr.error(mensaje, `Error en ${contexto}`);
  }

  /**
   * Muestra mensaje de éxito genérico.
   */
  mostrarExito(mensaje: string = 'Operación completada exitosamente', titulo: string = 'Éxito'): void {
    this.toastr.success(mensaje, titulo, { timeOut: 3000 });
  }

  /**
   * Valida y procesa documento antes de envío, mostrando errores si es necesario.
   */
  procesarDocumento(archivo: File, contexto: string = 'registro'): boolean {
    if (!archivo) {
      this.toastr.error('Documento requerido.', 'Error de validación');
      return false;
    }
    return this.validarTipoDocumento(archivo);
  }
}
