import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentoService } from '../../../../core/services/documento.service';
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService
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
        console.error('Error al cargar tipos de documento:', error);
      }
    });
  }

  guardarPropiedad(): void {
    if (this.formularioPropiedad.valid) {
      const datosPropiedad = this.formularioPropiedad.value;
      if (this.esEdicion) {
        // Llamar al servicio para actualizar
        console.log('Actualizando propiedad:', datosPropiedad);
      } else {
        // Llamar al servicio para crear
        console.log('Creando propiedad:', datosPropiedad);
      }
      // Redirigir al layout después de guardar
      this.router.navigate(['/rentero']);
    }
  }

  cancelar(): void {
    this.router.navigate(['/rentero']);
  }
}
