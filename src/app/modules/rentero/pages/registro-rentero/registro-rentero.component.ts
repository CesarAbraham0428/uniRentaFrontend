import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RenteroService } from '../../../../core/services/rentero.service';
import { FormularioRegistroRentero, RespuestaRegistroRentero } from '../../../../interfaces/rentero.interface';

@Component({
  selector: 'app-registro-rentero',
  templateUrl: './registro-rentero.component.html',
  styleUrls: ['./registro-rentero.component.scss']
})
export class RegistroRenteroComponent implements OnDestroy {
  pasoActual: number = 1;
  formulario: FormGroup;
  archivoSeleccionado: File | null = null;
  urlPrevisualizacion: string | null = null;
  procesando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private renteroService: RenteroService,
    private toastr: ToastrService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      archivo: [null, Validators.required]
    });
  }

  ngOnDestroy(): void {
    if (this.urlPrevisualizacion) {
      URL.revokeObjectURL(this.urlPrevisualizacion);
    }
  }

  get datosValidos(): boolean {
    const campos = ['nombre', 'apellido', 'telefono', 'email', 'password'];
    return campos.every(campo => this.formulario.get(campo)?.valid);
  }

  get archivoValido(): boolean {
    return this.formulario.get('archivo')?.valid ?? false;
  }

  get esImagen(): boolean {
    return this.archivoSeleccionado?.type?.startsWith('image/') ?? false;
  }

  get esPdf(): boolean {
    return this.archivoSeleccionado?.type === 'application/pdf';
  }

  siguientePaso(): void {
    if (this.datosValidos) {
      this.pasoActual = 2;
    }
  }

  anteriorPaso(): void {
    this.pasoActual = 1;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (this.urlPrevisualizacion) {
      URL.revokeObjectURL(this.urlPrevisualizacion);
    }

    if (archivo) {
      this.archivoSeleccionado = archivo;
      this.urlPrevisualizacion = URL.createObjectURL(archivo);
      this.formulario.patchValue({ archivo });
    } else {
      this.archivoSeleccionado = null;
      this.urlPrevisualizacion = null;
    }
  }

  registrar(): void {
    if (!this.formulario.valid || !this.archivoSeleccionado) {
      this.toastr.error('Por favor completa todos los campos', 'Formulario incompleto');
      return;
    }

    this.procesando = true;
    const datosRentero: FormularioRegistroRentero = {
      nombre: this.formulario.value.nombre,
      apellido: this.formulario.value.apellido,
      telefono: this.formulario.value.telefono,
      email: this.formulario.value.email,
      password: this.formulario.value.password
    };

    this.renteroService.registrarRentero(datosRentero, this.archivoSeleccionado).subscribe({
      next: (respuesta: RespuestaRegistroRentero) => {
        this.procesando = false;
        if (respuesta.exito) {
          this.toastr.success(respuesta.mensaje, '¡Registro exitoso!', { timeOut: 5000 });
          this.reiniciarFormulario();
        } else {
          const mensaje = respuesta.errores?.join(', ') || respuesta.mensaje;
          this.toastr.error(mensaje, 'Error en el registro');
        }
      },
      error: (error) => {
        this.procesando = false;
        const mensaje = error.error?.mensaje || error.message || 'Error al conectar con el servidor';
        this.toastr.error(mensaje, 'Error del servidor');
        console.error('Error al registrar rentero:', error);
      }
    });
  }

  reiniciarFormulario(): void {
    this.formulario.reset();
    this.archivoSeleccionado = null;
    this.urlPrevisualizacion = null;
    this.pasoActual = 1;
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) return `${campo} es requerido`;
    if (control.errors['minlength']) return `${campo} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['pattern']) return 'Formato inválido';
    
    return 'Campo inválido';
  }
}