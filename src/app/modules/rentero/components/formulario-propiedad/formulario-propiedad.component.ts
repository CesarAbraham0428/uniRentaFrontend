import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentoService } from '../../../../core/services/documento.service';
import { DocumentoValidacionService } from '../../../../core/services/documento-validacion.service';
import { TipoDocumento } from '../../../../interfaces/documento.interface';

@Component({
  selector: 'app-formulario-propiedad',
  templateUrl: './formulario-propiedad.component.html',
  styleUrl: './formulario-propiedad.component.scss'
})
export class FormularioPropiedadComponent implements OnInit {
  formularioPropiedad: FormGroup;
  esEdicion: boolean = false;
  idPropiedad: string | null = null;
  tiposDocumento: TipoDocumento[] = [];
  procesando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService,
    private documentoValidacionService: DocumentoValidacionService
  ) {
    this.formularioPropiedad = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      tipoDocumentoId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.idPropiedad = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.idPropiedad;
    this.cargarTiposDocumento();

    if (this.esEdicion) {
      // Aquí cargarías los datos de la propiedad por ID desde el servicio
      // Ejemplo: this.cargarDatosPropiedad(this.idPropiedad);
    }
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

  guardarPropiedad(): void {
    if (this.formularioPropiedad.valid) {
      this.procesando = true;
      const datosPropiedad = this.formularioPropiedad.value;
      if (this.esEdicion) {
        // Llamar al servicio para actualizar
        console.log('Actualizando propiedad:', datosPropiedad);
        this.procesando = false;
        this.documentoValidacionService.mostrarExito('Propiedad actualizada exitosamente');
        this.router.navigate(['/rentero']);
      } else {
        // Llamar al servicio para crear
        console.log('Creando propiedad:', datosPropiedad);
        this.procesando = false;
        this.documentoValidacionService.mostrarExito('Propiedad creada exitosamente');
        this.router.navigate(['/rentero']);
      }
    } else {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Por favor completa todos los campos requeridos' }, 'Formulario incompleto');
    }
  }

  cancelar(): void {
    this.router.navigate(['/rentero']);
  }
}
