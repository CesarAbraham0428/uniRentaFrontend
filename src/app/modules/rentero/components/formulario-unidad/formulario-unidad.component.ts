import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import {
  FormularioRegistroUnidad,
  FormularioActualizacionUnidad,
  UnidadCompleta
} from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-formulario-unidad',
  templateUrl: './formulario-unidad.component.html',
  styleUrl: './formulario-unidad.component.scss'
})
export class FormularioUnidadComponent implements OnInit {
  formularioUnidad: FormGroup;
  procesando = false;
  propiedadId: number = 0;
  unidadId: number = 0;
  propiedadNombre = '';
  esEdicion = false;
  unidadActual: UnidadCompleta | null = null; // ← CAMBIADO: ahora usa UnidadCompleta

  serviciosDisponibles = [
    'Agua', 'Luz', 'Gas', 'Internet', 'Cable', 'Limpieza',
    'Seguridad', 'Estacionamiento', 'Lavandería'
  ];
  serviciosSeleccionados: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propiedadService: PropiedadService
  ) {
    this.formularioUnidad = this.crearFormulario();
  }

  ngOnInit(): void {
    this.detectarModo();
    this.inicializarFormulario();
  }

  private detectarModo(): void {
    const params = this.route.snapshot.params;
    console.log('🔍 Parámetros de ruta:', params);
    console.log('🔍 URL actual:', this.router.url);

    if (this.route.snapshot.url.some(segment => segment.path === 'nueva-unidad')) {
      this.esEdicion = false;
      this.propiedadId = +params['propiedadId'];

      // VALIDACIÓN CRÍTICA CORREGIDA
      if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
        console.error('❌ PropiedadId INVÁLIDO:', this.propiedadId);
        console.error('❌ Params completos:', params);
        this.mostrarError('ID de propiedad inválido', 'Error de navegación');
        this.router.navigate(['/rentero']);
        return;
      }

      console.log('✅ PropiedadId válido:', this.propiedadId);
      this.cargarNombrePropiedad();
    } else if (this.route.snapshot.url.some(segment => segment.path === 'editar')) {
      this.esEdicion = true;
      this.unidadId = +params['unidadId'];

      if (!this.unidadId || this.unidadId === 0 || isNaN(this.unidadId)) {
        console.error('❌ UnidadId INVÁLIDO:', this.unidadId);
        this.mostrarError('ID de unidad inválido', 'Error de navegación');
        this.router.navigate(['/rentero']);
        return;
      }

      this.cargarUnidadParaEdicion();
    }
  }

  private crearFormulario(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      precio: ['', [Validators.required, Validators.min(1)]],
      terraza: [false],
      amueblado: [false],
      caracteristicas: [''],
      disponible: [true],
      imagenes: [[]]
    });
  }

  private inicializarFormulario(): void {
    // Generar nombre por defecto si es nueva unidad
    if (!this.esEdicion) {
      const fechaHora = new Date().toLocaleString('es-MX');
      this.formularioUnidad.patchValue({
        nombre: `Unidad ${fechaHora}`
      });
    }

    this.formularioUnidad.updateValueAndValidity();
  }

  private cargarNombrePropiedad(): void {
    if (!this.propiedadId) {
      console.error('No hay propiedadId para cargar nombre');
      return;
    }

    this.propiedadService.obtenerPropiedadesDelRentero().subscribe({
      next: (response) => {
        console.log('✅ Respuesta de propiedades:', response);
        if (response.success && response.data) {
          const propiedad = response.data.find((p: any) => p.id === this.propiedadId);
          if (propiedad) {
            this.propiedadNombre = propiedad.nombre;
            console.log('✅ Nombre de propiedad cargado:', this.propiedadNombre);
          } else {
            console.warn('⚠️ Propiedad no encontrada con ID:', this.propiedadId);
            this.propiedadNombre = `Propiedad ID: ${this.propiedadId}`;
          }
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar nombre de propiedad:', error);
        this.propiedadNombre = `Propiedad ID: ${this.propiedadId}`;
      }
    });
  }

  private cargarUnidadParaEdicion(): void {
    console.log('🔄 Cargando unidad para edición:', this.unidadId);
    this.propiedadNombre = 'Cargando...';

    // ← CAMBIADO: ahora maneja UnidadCompleta
    this.propiedadService.obtenerUnidadCompletaPorId(this.unidadId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unidadActual = response.data; // UnidadCompleta
          this.llenarFormularioConDatos(this.unidadActual);

          // ← CAMBIADO: obtener nombre directamente de la ubicación
          this.propiedadId = this.unidadActual.propiedad_id;
          this.propiedadNombre = this.unidadActual.ubicacion.nombre; // Ya viene en la respuesta

          console.log('✅ Unidad completa cargada:', this.unidadActual);
          console.log('✅ Nombre de propiedad:', this.propiedadNombre);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar unidad:', error);
        this.mostrarError('No se pudo cargar la unidad', 'Error');
        this.router.navigate(['/rentero']);
      }
    });
  }

  // ← CAMBIADO: ahora recibe UnidadCompleta
  private llenarFormularioConDatos(unidad: UnidadCompleta): void {
    this.formularioUnidad.patchValue({
      nombre: unidad.nombre || '',
      precio: unidad.precio || 0,
      terraza: unidad.descripcion?.terraza || false,
      amueblado: unidad.descripcion?.amueblado || false,
      caracteristicas: unidad.descripcion?.caracteristicas || '',
      disponible: unidad.estado === 'libre',
      imagenes: unidad.imagenes || []
    });

    // Cargar servicios seleccionados
    this.serviciosSeleccionados = unidad.descripcion?.servicios || [];
  }

  toggleServicio(servicio: string): void {
    const index = this.serviciosSeleccionados.indexOf(servicio);
    if (index === -1) {
      this.serviciosSeleccionados.push(servicio);
    } else {
      this.serviciosSeleccionados.splice(index, 1);
    }
    console.log('🔧 Servicios seleccionados:', this.serviciosSeleccionados);
  }

  isServicioSeleccionado(servicio: string): boolean {
    return this.serviciosSeleccionados.includes(servicio);
  }

  agregarImagen(): void {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url && url.trim()) {
      const imagenesActuales = this.formularioUnidad.get('imagenes')?.value || [];
      if (imagenesActuales.length < 10) {
        imagenesActuales.push(url.trim());
        this.formularioUnidad.patchValue({ imagenes: imagenesActuales });
      } else {
        this.mostrarError('Solo puedes agregar hasta 10 imágenes', 'Límite alcanzado');
      }
    }
  }

  eliminarImagen(index: number): void {
    const imagenesActuales = this.formularioUnidad.get('imagenes')?.value || [];
    imagenesActuales.splice(index, 1);
    this.formularioUnidad.patchValue({ imagenes: imagenesActuales });
  }

  get imagenesFormArray() {
    return this.formularioUnidad.get('imagenes')?.value || [];
  }

  guardarUnidad(): void {
    console.log('🚀 INICIANDO GUARDADO DE UNIDAD');

    // VALIDACIONES DETALLADAS
    if (!this.formularioUnidad.valid) {
      console.error('❌ Formulario inválido');
      this.mostrarErroresFormulario();
      return;
    }

    // VERIFICAR TOKEN
    const token = localStorage.getItem('rentero_token') || sessionStorage.getItem('rentero_token');
    if (!token) {
      console.error('❌ No hay token de autenticación');
      this.mostrarError('No estás autenticado', 'Error de autenticación');
      this.router.navigate(['/rentero/login']);
      return;
    }

    if (this.esEdicion) {
      this.actualizarUnidad();
    } else {
      this.crearUnidad();
    }
  }

  private mostrarErroresFormulario(): void {
    Object.keys(this.formularioUnidad.controls).forEach(key => {
      const control = this.formularioUnidad.get(key);
      if (control?.invalid) {
        control.markAsTouched();
        console.error(`❌ Campo inválido: ${key}`, control.errors);
      }
    });
    this.mostrarError('Por favor completa todos los campos requeridos', 'Formulario incompleto');
  }

  private crearUnidad(): void {
    console.log('📝 CREANDO NUEVA UNIDAD');
    this.procesando = true;

    const formValue = this.formularioUnidad.value;
    console.log('🔍 Valor del formulario:', formValue);

    // VERIFICAR PROPIEDAD ID ANTES DE ENVIAR
    if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
      console.error('❌ PropiedadId inválido al momento de enviar:', this.propiedadId);
      this.procesando = false;
      this.mostrarError('ID de propiedad inválido', 'Error de datos');
      return;
    }

    const datosUnidad: FormularioRegistroUnidad = {
      propiedad_id: this.propiedadId,
      nombre: formValue.nombre || `Unidad ${Date.now()}`,
      precio: parseFloat(formValue.precio),
      descripcion: {
        terraza: formValue.terraza || false,
        amueblado: formValue.amueblado || false,
        servicios: this.serviciosSeleccionados,
        caracteristicas: formValue.caracteristicas || ''
      },
      imagenes: formValue.imagenes || []
    };

    console.log('📤 DATOS FINALES A ENVIAR:', JSON.stringify(datosUnidad, null, 2));

    this.propiedadService.registrarUnidad(datosUnidad).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa del servidor:', response);
        this.procesando = false;

        if (response.success || response.mensaje) {
          this.mostrarExito(response.mensaje || 'Unidad registrada exitosamente');
          this.volverAPropiedades();
        } else {
          console.error('❌ Respuesta no exitosa:', response);
          this.mostrarError('Error al registrar la unidad', 'Error');
        }
      },
      error: (error) => {
        console.error('❌ ERROR COMPLETO DEL SERVIDOR:', error);
        this.procesando = false;

        let mensaje = 'Error interno del servidor';
        if (error.error?.mensaje) {
          mensaje = error.error.mensaje;
        } else if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.message) {
          mensaje = error.message;
        }

        this.mostrarError(`${mensaje} (Status: ${error.status})`, 'Error al registrar unidad');
      }
    });
  }

  private actualizarUnidad(): void {
    this.procesando = true;
    const formValue = this.formularioUnidad.value;

    const datosActualizacion: FormularioActualizacionUnidad = {
      nombre: formValue.nombre,
      precio: parseFloat(formValue.precio),
      estado: formValue.disponible ? 'libre' : 'ocupada',
      descripcion: {
        terraza: formValue.terraza || false,
        amueblado: formValue.amueblado || false,
        servicios: this.serviciosSeleccionados,
        caracteristicas: formValue.caracteristicas || ''
      },
      imagenes: formValue.imagenes || []
    };

    this.propiedadService.actualizarUnidad(this.unidadId, datosActualizacion).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success || response.mensaje) {
          this.mostrarExito(response.mensaje || 'Unidad actualizada exitosamente');
          this.volverAPropiedades();
        } else {
          this.mostrarError('Error al actualizar la unidad', 'Error');
        }
      },
      error: (error) => {
        console.error('Error al actualizar unidad:', error);
        this.procesando = false;

        let mensaje = 'Error al actualizar la unidad';
        if (error.error?.mensaje) {
          mensaje = error.error.mensaje;
        }

        this.mostrarError(mensaje, 'Error del servidor');
      }
    });
  }

  volverAPropiedades(): void {
    this.router.navigate(['/rentero']);
  }

  cancelar(): void {
    if (confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
      this.volverAPropiedades();
    }
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.formularioUnidad.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formularioUnidad.get(campo);
    if (!control?.errors || !control?.touched) return '';

    const err = control.errors;
    if (err['required']) return `${campo} es requerido`;
    if (err['min']) return `El valor debe ser mayor a ${err['min'].min}`;
    if (err['minlength']) return `Debe tener al menos ${err['minlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  private mostrarError(mensaje: string, titulo: string): void {
    alert(`${titulo}: ${mensaje}`);
  }

  private mostrarExito(mensaje: string): void {
    alert(mensaje);
  }

  formatearPrecio(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  }
}
