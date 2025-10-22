import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class DocumentoValidacionService {
  constructor(private toastr: ToastrService) {}

  validarTipoDocumento(archivo: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.toastr.error('Solo PNG, JPG o PDF', 'Formato no permitido');
      return false;
    }
    return true;
  }

  validarDocumentoINE(archivo: File): boolean {
    if (!archivo) {
      this.toastr.error('Documento requerido', 'Error');
      return false;
    }

    if (!this.validarTipoDocumento(archivo)) {
      return false;
    }

    const maxSize = 1 * 1024 * 1024;
    if (archivo.size > maxSize) {
      this.toastr.error('Archivo muy grande (máximo 1 MB)', 'Error');
      return false;
    }

    return true;
  }

  manejarErrores(error: any, contexto: string = 'operación'): void {
    const payload = error?.error ?? error ?? {};
    const tipo = payload?.tipo as string | undefined;
    const subtipo = payload?.subtipo as string | undefined;
    const detalles: string[] = payload?.detalles || payload?.faltantes || [];
    const mensaje = payload?.mensaje || error?.message || 'Error desconocido';

    // Errores de Base de Datos
    if (tipo === 'BASE_DATOS') {
      // Email duplicado
      if (mensaje.includes('correo electronico') && mensaje.includes('Ya existe')) {
        this.mostrarAlertaSweet(
          'Correo ya registrado',
          'Este correo electrónico ya está asociado a una cuenta. Ingresa otro correo.',
          'error'
        );
        return;
      }

      // Teléfono duplicado
      if (mensaje.includes('telefono') && mensaje.includes('Ya existe')) {
        this.mostrarAlertaSweet(
          'Teléfono ya registrado',
          'Este teléfono ya está asociado a una cuenta. Ingresa otro teléfono.',
          'error'
        );
        return;
      }

      // Error genérico de base de datos
      this.mostrarAlertaSweet(
        'Error en la base de datos',
        mensaje,
        'error'
      );
      return;
    }

    // Errores de Validación de Documento
    if (tipo === 'VALIDACION_DOCUMENTO') {
      // NUEVO: Nombre no coincide
      if (subtipo === 'NOMBRE_NO_COINCIDE') {
        const similitud = payload?.detalles?.similitud || 0;
        const porcentaje = Math.round(similitud * 100);
        const html = `
          <div class="nombre-no-coincide-contenedor">
            <p>El nombre que escribiste en el formulario no coincide con el del documento.</p>
            <p><strong>Similitud detectada: ${porcentaje}%</strong></p>
            <p>Verifica que hayas escrito correctamente tu nombre tal como aparece en tu credencial de lector (INE).</p>
          </div>
        `;
        this.mostrarAlertaSweet(
          'Nombre no coincide',
          html,
          'warning'
        );
        return;
      }

      if (subtipo === 'FALTAN CAMPOS AL DOCUMENTO') {
        const camposHTML = this.generarCamposHTML(detalles);
        this.mostrarAlertaSweet(
          'Campos no visibles',
          camposHTML,
          'warning'
        );
        return;
      }

      if (subtipo === 'DOCUMENTO INVALIDO') {
        this.mostrarAlertaSweet(
          'Documento inválido',
          'Verifica que sea el documento correcto e intenta de nuevo',
          'error'
        );
        return;
      }

      this.mostrarAlertaSweet(
        'Documento inválido',
        'Verifica que sea el documento correcto e intenta de nuevo',
        'error'
      );
      return;
    }

    // Errores de Documento
    if (tipo === 'DOCUMENTO' && mensaje) {
      // Nombre no coincide
      if (mensaje.includes('nombre del documento no coincide')) {
        const html = `
          <div class="nombre-no-coincide-contenedor">
            <p>El nombre que escribiste en el formulario no coincide con el del documento.</p>
            <p>Verifica que hayas escrito correctamente tu nombre tal como aparece en tu credencial de lector (INE).</p>
          </div>
        `;
        this.mostrarAlertaSweet(
          'Nombre no coincide',
          html,
          'warning'
        );
        return;
      }

      const { hayCampos, campos, conteo } = this.detectarCamposFaltantes(mensaje);
      if (hayCampos) {
        if (conteo >= 4) {
          this.mostrarAlertaSweet(
            'Documento inválido',
            'Verifica que sea el documento correcto e intenta de nuevo',
            'error'
          );
        } else {
          const camposHTML = this.generarCamposHTML(campos);
          this.mostrarAlertaSweet(
            'Campos no visibles',
            camposHTML,
            'warning'
          );
        }
        return;
      }
    }

    // Errores de Archivo
    if (tipo === 'ARCHIVO') {
      this.mostrarAlertaSweet(
        'Error en archivo',
        'Verifica el formato o tamaño del documento',
        'error'
      );
      return;
    }

    // Errores de OCR
    if (tipo === 'OCR') {
      this.mostrarAlertaSweet(
        'Error al procesar',
        'No se pudo leer el documento, intenta de nuevo',
        'error'
      );
      return;
    }

    // Errores de red (solo si NO hay un tipo específico)
    if (!tipo && (error?.status === 0 || error?.status === 500)) {
      this.mostrarAlertaSweet(
        'Error de conexión',
        'Verifica tu conexión e intenta de nuevo',
        'error'
      );
      return;
    }

    this.mostrarAlertaSweet('Error', mensaje, 'error');
  }

  mostrarExito(mensaje: string = 'Operación completada', titulo: string = 'Éxito'): void {
    this.toastr.success(mensaje, titulo, { timeOut: 3000 });
  }

  mostrarExitoPropiedad(mensaje: string = 'Propiedad creada exitosamente'): void {
    this.toastr.success(mensaje, 'Éxito', { timeOut: 3000, progressBar: true });
  }

  procesarDocumento(archivo: File, contexto: string = 'registro'): boolean {
    if (!archivo) {
      this.toastr.error('Documento requerido', 'Error');
      return false;
    }
    return this.validarTipoDocumento(archivo);
  }

  private generarCamposHTML(campos: string[]): string {
    const camposFormateados = campos
      .map(campo => `<span class="campo-faltante">${this.limpiarNombreCampo(campo)}</span>`)
      .join(', ');
    
    return `Toma una foto más clara donde se vean estos campos: <br><div class="campos-contenedor">${camposFormateados}</div>`;
  }

  private limpiarNombreCampo(campo: string): string {
    return campo
      .trim()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private detectarCamposFaltantes(mensaje: string): { hayCampos: boolean; campos: string[]; conteo: number } {
    const patronCampos = /Faltan?\s+(\d+)\s+campo\(s\):\s*([^,}]+)/i;
    const match = mensaje.match(patronCampos);
    if (match) {
      const conteo = parseInt(match[1]);
      const camposTexto = match[2];
      const campos = camposTexto.split(',').map((campo: string) => campo.trim());
      return { hayCampos: true, campos, conteo };
    }
    return { hayCampos: false, campos: [], conteo: 0 };
  }

  private mostrarAlertaSweet(titulo: string, html: string, icono: 'warning' | 'error'): void {
    const colorBorder = icono === 'warning' ? '#ff9800' : '#f44336';
    
    Swal.fire({
      icon: icono,
      title: titulo,
      html: html,
      timer: 8000,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'center',
      customClass: {
        container: 'alerta-custom',
        popup: 'alerta-popup',
        title: 'alerta-titulo',
        htmlContainer: 'alerta-contenido',
      },
      didOpen: (modal) => {
        modal.style.borderLeft = `5px solid ${colorBorder}`;
      }
    });
  }
}