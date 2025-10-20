import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { DocumentoService } from '../../../../core/services/documento.service';
import { DocumentoValidacionService } from '../../../../core/services/documento-validacion.service';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { RenteroService } from '../../../../core/services/rentero.service';

import { TipoDocumento } from '../../../../interfaces/documento.interface';
import { FormularioRegistroPropiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-formulario-propiedad',
  templateUrl: './formulario-propiedad.component.html',
  styleUrl: './formulario-propiedad.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(-20px)' }))
      ])
    ])
  ]
})
export class FormularioPropiedadComponent implements OnInit, OnDestroy {
  formularioPropiedad: FormGroup;
  esEdicion: boolean = false;
  idPropiedad: string | null = null;
  tiposDocumento: TipoDocumento[] = [];
  procesando: boolean = false;
  pasoActual: number = 1;
  archivoSeleccionado: File | null = null;
  urlPrevisualizacion: string | null = null;
  mostrarPassword: boolean = false;
  mostrarPasos: boolean = true;

  direccionBusqueda: string | null = null;
  coordsIniciales: [number, number] | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService,
    private documentoValidacionService: DocumentoValidacionService,
    private propiedadService: PropiedadService,
    private renteroService: RenteroService
  ) {
    this.formularioPropiedad = this.fb.group({
      nombre: ['', [Validators.required]],
      ubicacionCalle: [''],
      ubicacionColonia: [''],
      ubicacionNumero: [''],
      ubicacionCodigoPostal: [''],
      ubicacionMunicipio: [''],
      ubicacionEstado: [''],
      ubicacionLatitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      ubicacionLongitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      tipoDocumentoId: [null],
      archivo: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.idPropiedad = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.idPropiedad;
    this.mostrarPasos = !this.esEdicion; 

    if (this.mostrarPasos) {
      this.pasoActual = 1;
    }

    this.cargarTiposDocumento();

    if (this.esEdicion) {
      this.cargarDatosPropiedad();
    }

    const lat = parseFloat(this.formularioPropiedad.get('ubicacionLatitud')?.value);
    const lng = parseFloat(this.formularioPropiedad.get('ubicacionLongitud')?.value);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
      this.coordsIniciales = [lng, lat];
    }

    this.formularioPropiedad.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.direccionBusqueda = this.isDireccionCompleta()
          ? this.buildSearchText()
          : null;
      });

    this.direccionBusqueda = this.isDireccionCompleta() ? this.buildSearchText() : null;
  }

  private isDireccionCompleta(): boolean {
    const f = this.formularioPropiedad.value;
    const req = [
      f.ubicacionCalle,
      f.ubicacionNumero,
      f.ubicacionColonia,
      f.ubicacionCodigoPostal,
      f.ubicacionMunicipio,
      f.ubicacionEstado
    ];
    return req.every((v: any) => !!v && String(v).trim() !== '');
  }

  private buildSearchText(): string {
    const v = this.formularioPropiedad.value;
    return [
      v.ubicacionCalle,
      v.ubicacionNumero,
      v.ubicacionColonia,
      v.ubicacionCodigoPostal,
      v.ubicacionMunicipio,
      v.ubicacionEstado
    ]
      .map((x: string) => String(x).trim())
      .join(', ');
  }

  onCoordsChange(ev: { lng: number; lat: number }) {
    this.formularioPropiedad.patchValue(
      {
        ubicacionLatitud: ev.lat.toFixed(6),
        ubicacionLongitud: ev.lng.toFixed(6)
      },
      { emitEvent: false } // evita disparar otra búsqueda al confirmar coords
    );
  }

  ngOnDestroy(): void {
    if (this.urlPrevisualizacion) {
      URL.revokeObjectURL(this.urlPrevisualizacion);
    }
  }

  get datosValidos(): boolean {
    const campos = [
      'nombre',
      'ubicacionCalle',
      'ubicacionColonia',
      'ubicacionNumero',
      'ubicacionCodigoPostal',
      'ubicacionMunicipio',
      'ubicacionEstado',
      'ubicacionLatitud',
      'ubicacionLongitud'
    ];
    return campos.every(campo => this.formularioPropiedad.get(campo)?.valid);
  }

  get archivoValido(): boolean {
    return this.formularioPropiedad.get('archivo')?.valid ?? false;
  }

  get esImagen(): boolean {
    return this.archivoSeleccionado?.type?.startsWith('image/') ?? false;
  }

  get esPdf(): boolean {
    return this.archivoSeleccionado?.type === 'application/pdf';
  }

  cargarTiposDocumento(): void {
    this.documentoService.obtenerTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
      },
      error: (error) => {
        this.documentoValidacionService.manejarErrores(error, 'carga de tipos de documento');
      }
    });
  }

  cargarDatosPropiedad(): void {
    const propiedadEjemplo = {
      nombre: 'Casa Ejemplo',
      estado: 'Disponible',
      ubicacionCalle: 'Principal',
      ubicacionColonia: 'Centro',
      ubicacionNumero: '123',
      ubicacionCodigoPostal: '12345',
      ubicacionMunicipio: 'Ciudad Ejemplo',
      ubicacionEstado: 'Estado Ejemplo',
      ubicacionLatitud: '19.4326',
      ubicacionLongitud: '-99.1332',
      tipoDocumentoId: 1
    };

    this.formularioPropiedad.patchValue(propiedadEjemplo);
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

    if (this.urlPrevisualizacion) URL.revokeObjectURL(this.urlPrevisualizacion);

    if (archivo) {
      if (this.documentoValidacionService.procesarDocumento(archivo, 'registro')) {
        this.archivoSeleccionado = archivo;
        this.urlPrevisualizacion = URL.createObjectURL(archivo);
        this.formularioPropiedad.patchValue({ archivo });
      }
    } else {
      this.archivoSeleccionado = null;
      this.urlPrevisualizacion = null;
    }
  }

  guardarPropiedad(): void {
    if (!this.esEdicion && !this.formularioPropiedad.valid) {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Por favor completa todos los campos' }, 'Formulario incompleto');
      return;
    }

    if (this.esEdicion && !this.datosValidos) {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Por favor completa todos los campos requeridos' }, 'Formulario incompleto');
      return;
    }

    if (!this.archivoSeleccionado) {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Debes seleccionar un archivo' }, 'Archivo requerido');
      return;
    }

    this.procesando = true;
    const datosPropiedad = this.formularioPropiedad.value;

    const usuarioActual = this.renteroService.obtenerUsuarioActual();
    if (!usuarioActual) {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Usuario no autenticado' }, 'Error de autenticación');
      this.procesando = false;
      return;
    }

    const ubicacion = {
      nombre: datosPropiedad.nombre,
      direccion: `${datosPropiedad.ubicacionCalle} ${datosPropiedad.ubicacionNumero}, ${datosPropiedad.ubicacionColonia}`,
      calle: datosPropiedad.ubicacionCalle,
      colonia: datosPropiedad.ubicacionColonia,
      numero: datosPropiedad.ubicacionNumero,
      codigo_postal: datosPropiedad.ubicacionCodigoPostal,
      municipio: datosPropiedad.ubicacionMunicipio || null,
      estado: datosPropiedad.ubicacionEstado || null,
      coordenadas: {
        crs: {
          type: 'name',
          properties: { name: 'EPSG:4326' }
        },
        type: 'Point',
        coordinates: [
          parseFloat(datosPropiedad.ubicacionLongitud) || 0,
          parseFloat(datosPropiedad.ubicacionLatitud) || 0
        ]
      }
    };

    const formularioRegistroPropiedad: FormularioRegistroPropiedad = {
      nombre: datosPropiedad.nombre,
      ubicacion: ubicacion,
      rentero_id: usuarioActual.id
    };

    if (this.esEdicion) {
      console.log('Actualizando propiedad:', formularioRegistroPropiedad);
      this.procesando = false;
      this.documentoValidacionService.mostrarExito('Propiedad actualizada exitosamente');
      this.router.navigate(['/rentero']);
    } else {
      console.log('Datos a enviar:', formularioRegistroPropiedad); // Para debug

      this.propiedadService.registrarPropiedad(
        formularioRegistroPropiedad,
        this.archivoSeleccionado,
        datosPropiedad.tipoDocumentoId
      ).subscribe({
        next: (respuesta) => {
          console.log('Propiedad creada exitosamente:', respuesta);
          this.procesando = false;
          this.documentoValidacionService.mostrarExito('Propiedad creada exitosamente');
          this.router.navigate(['/rentero']);
        },
        error: (error) => {
          console.error('Error al crear propiedad:', error);
          this.procesando = false;
          this.documentoValidacionService.manejarErrores(error, 'registro de propiedad');
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/rentero']);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formularioPropiedad.get(campo);
    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) return `${campo} es requerido`;
    if (control.errors['minlength']) return `${campo} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['min']) {
      if (campo.includes('Latitud')) return 'Latitud debe ser mayor o igual a -90';
      if (campo.includes('Longitud')) return 'Longitud debe ser mayor o igual a -180';
      return `${campo} debe ser mayor a ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      if (campo.includes('Latitud')) return 'Latitud debe ser menor o igual a 90';
      if (campo.includes('Longitud')) return 'Longitud debe ser menor o igual a 180';
      return `${campo} debe ser menor a ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) return 'Formato inválido';

    return 'Campo inválido';
  }
}
