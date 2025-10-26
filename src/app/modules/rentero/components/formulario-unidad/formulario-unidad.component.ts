import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import {
  FormularioRegistroUnidad,
  FormularioActualizacionUnidad,
  Unidad
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
  unidadActual: Unidad | null = null;

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

      // VALIDACIÓN CRÍTICA
      if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
        console.error('❌ PropiedadId INVÁLIDO:', this.propiedadId);
        console.error('❌ Params completos:', params);
        this.mostrarError('ID de propiedad inválido', 'Error de navegación');
        return;
      }

      console.log('✅ PropiedadId válido:', this.propiedadId);
      this.cargarNombrePropiedad();
    } else if (this.route.snapshot.url.some(segment => segment.path === 'editar')) {
      this.esEdicion = true;
      this.unidadId = +params['unidadId'];
      this.cargarUnidadParaEdicion();
    }
  }

  private crearFormulario(): FormGroup {
    return this.fb.group({
      precio: ['', [Validators.required, Validators.min(1)]],
      terraza: [false],
      amueblado: [false],
      caracteristicas: [''],
      disponible: [true],
      imagenes: [[]]
    });
  }

  private inicializarFormulario(): void {
    this.formularioUnidad.get('precio')?.setValidators([
      Validators.required,
      Validators.min(1)
    ]);
    this.formularioUnidad.updateValueAndValidity();
  }

  private cargarNombrePropiedad(): void {
    this.propiedadService.obtenerPropiedadesDelRentero().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const propiedad = response.data.find(p => p.id === this.propiedadId);
          this.propiedadNombre = propiedad ? propiedad.nombre : `Propiedad ID: ${this.propiedadId}`;
        }
      },
      error: (error) => {
        console.error('Error al cargar nombre de propiedad:', error);
        this.propiedadNombre = `Propiedad ID: ${this.propiedadId}`;
      }
    });
  }

  private cargarUnidadParaEdicion(): void {
    console.log('Cargar unidad para edición:', this.unidadId);
    this.propiedadNombre = 'Cargando...';
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
    console.log('🔍 Estado del formulario:', this.formularioUnidad.valid);
    console.log('🔍 Errores del formulario:', this.formularioUnidad.errors);
    console.log('🔍 PropiedadId actual:', this.propiedadId);
    console.log('🔍 Tipo de propiedadId:', typeof this.propiedadId);

    if (!this.formularioUnidad.valid) {
      console.error('❌ Formulario inválido');
      Object.keys(this.formularioUnidad.controls).forEach(key => {
        const control = this.formularioUnidad.get(key);
        if (control?.invalid) {
          console.error(`❌ Campo inválido: ${key}`, control.errors);
        }
      });
      this.mostrarError('Por favor completa todos los campos requeridos', 'Formulario incompleto');
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
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    if (this.esEdicion) {
      this.actualizarUnidad();
    } else {
      this.crearUnidad();
    }
  }

  private crearUnidad(): void {
    console.log('📝 CREANDO NUEVA UNIDAD');
    this.procesando = true;

    const formValue = this.formularioUnidad.value;
    console.log('🔍 Valor del formulario:', formValue);
    console.log('🔍 Servicios seleccionados:', this.serviciosSeleccionados);

    // VERIFICAR PROPIEDAD ID ANTES DE ENVIAR
    if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
      console.error('❌ PropiedadId inválido al momento de enviar:', this.propiedadId);
      this.procesando = false;
      this.mostrarError('ID de propiedad inválido', 'Error de datos');
      return;
    }

    const datosUnidad: FormularioRegistroUnidad = {
      propiedad_id: this.propiedadId,
      precio: parseFloat(formValue.precio),
      descripcion: {
        terraza: formValue.terraza || false,
        amueblado: formValue.amueblado || false,
        servicios: this.serviciosSeleccionados,
        caracteristicas: formValue.caracteristicas || ''
      },
      imagenes: formValue.imagenes || []
    };

    console.log('📤 DATOS FINALES A ENVIAR:');
    console.log('🔍 datosUnidad completo:', JSON.stringify(datosUnidad, null, 2));
    console.log('🔍 Precio tipo:', typeof datosUnidad.precio);
    console.log('🔍 PropiedadId tipo:', typeof datosUnidad.propiedad_id);
    console.log('🔍 Descripción tipo:', typeof datosUnidad.descripcion);
    console.log('🔍 Imagenes tipo:', typeof datosUnidad.imagenes);

    this.propiedadService.registrarUnidad(datosUnidad).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa del servidor:', response);
        this.procesando = false;

        if (response.success) {
          this.mostrarExito('Unidad registrada exitosamente');
          this.volverAPropiedades();
        } else {
          console.error('❌ Respuesta no exitosa:', response);
          this.mostrarError('Error al registrar la unidad', 'Error');
        }
      },
      error: (error) => {
        console.error('❌ ERROR COMPLETO DEL SERVIDOR:');
        console.error('Status:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('Error body:', error.error);
        console.error('Message:', error.message);
        console.error('Headers:', error.headers);
        console.error('URL:', error.url);

        this.procesando = false;

        let mensaje = 'Error interno del servidor';
        if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.error?.mensaje) {
          mensaje = error.error.mensaje;
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

    const datosActualizacion: FormularioActualizacionUnidad = {};

    if (formValue.precio) datosActualizacion.precio = parseFloat(formValue.precio);
    if (formValue.disponible !== undefined) datosActualizacion.disponible = formValue.disponible;

    datosActualizacion.descripcion = {
      terraza: formValue.terraza || false,
      amueblado: formValue.amueblado || false,
      servicios: this.serviciosSeleccionados,
      caracteristicas: formValue.caracteristicas || ''
    };

    if (formValue.imagenes) datosActualizacion.imagenes = formValue.imagenes;

    this.propiedadService.actualizarUnidad(this.unidadId, datosActualizacion).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success) {
          this.mostrarExito('Unidad actualizada exitosamente');
          this.volverAPropiedades();
        } else {
          this.mostrarError('Error al actualizar la unidad', 'Error');
        }
      },
      error: (error) => {
        console.error('Error al actualizar unidad:', error);
        this.procesando = false;
        this.mostrarError('Error al actualizar la unidad', 'Error del servidor');
      }
    });
  }

  volverAPropiedades(): void {
    this.router.navigate(['/rentero']);
  }

  cancelar(): void {
    this.volverAPropiedades();
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
    if (err['min']) return `El precio debe ser mayor a ${err['min'].min}`;

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
