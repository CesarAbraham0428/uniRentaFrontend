import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { Unidad } from '../../../../interfaces/propiedad.interface';

// Define la interfaz temporal que coincide con los datos reales
interface PropiedadBackend {
  id: number;
  nombre: string;
  calle: string;
  colonia: string;
  numero: string;
  municipio: string;
  visible?: boolean;
}

@Component({
  selector: 'app-rentero-layout',
  templateUrl: './rentero-layout.component.html',
  styleUrl: './rentero-layout.component.scss'
})
export class RenteroLayoutComponent implements OnInit {
  propiedades: PropiedadBackend[] = [];
  cargando = false;
  error = '';
  unidadesPorPropiedad: { [key: number]: number } = {};

  // Nuevas propiedades para manejo de unidades
  propiedadExpandida: number | null = null;
  unidadesActuales: Unidad[] = [];
  cargandoUnidades = false;

  constructor(
    private router: Router,
    private propiedadService: PropiedadService
  ) {}

  ngOnInit(): void {
    this.cargarPropiedades();
  }

  cargarPropiedades(): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedadesDelRentero().subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        if (response.success && response.data) {
          this.propiedades = response.data as PropiedadBackend[];
          console.log('Propiedades cargadas:', this.propiedades);
          this.cargarContadoresUnidades();
        } else {
          this.error = 'No se pudieron cargar las propiedades';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar propiedades:', error);
        this.error = 'Error al cargar las propiedades. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  private cargarContadoresUnidades(): void {
    this.propiedades.forEach(propiedad => {
      this.propiedadService.obtenerUnidadesPorPropiedad(propiedad.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.unidadesPorPropiedad[propiedad.id] = response.data.length;
          } else {
            this.unidadesPorPropiedad[propiedad.id] = 0;
          }
        },
        error: (error) => {
          console.error(`Error al cargar unidades para propiedad ${propiedad.id}:`, error);
          this.unidadesPorPropiedad[propiedad.id] = 0;
        }
      });
    });
  }

  // Nuevos métodos para manejo de unidades
  toggleUnidades(propiedadId: number): void {
    if (this.propiedadExpandida === propiedadId) {
      // Si ya está expandida, la cerramos
      this.propiedadExpandida = null;
      this.unidadesActuales = [];
    } else {
      // Expandir y cargar unidades
      this.propiedadExpandida = propiedadId;
      this.cargarUnidadesDetalle(propiedadId);
    }
  }

  private cargarUnidadesDetalle(propiedadId: number): void {
    this.cargandoUnidades = true;
    this.unidadesActuales = [];

    this.propiedadService.obtenerUnidadesPorPropiedad(propiedadId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unidadesActuales = response.data;
        }
        this.cargandoUnidades = false;
      },
      error: (error) => {
        console.error('Error al cargar unidades detalle:', error);
        this.cargandoUnidades = false;
      }
    });
  }

  editarUnidad(unidadId: number): void {
    this.router.navigate(['/rentero/unidades', unidadId, 'editar']);
  }

  eliminarUnidad(unidadId: number): void {
    if (confirm('¿Estás seguro de eliminar esta unidad? Esta acción no se puede deshacer.')) {
      this.propiedadService.eliminarUnidad(unidadId).subscribe({
        next: (response) => {
          // Actualizar la lista de unidades
          this.unidadesActuales = this.unidadesActuales.filter(u => u.id !== unidadId);

          // Actualizar el contador
          if (this.propiedadExpandida) {
            this.unidadesPorPropiedad[this.propiedadExpandida] = this.unidadesActuales.length;
          }

          console.log('Unidad eliminada exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar unidad:', error);
        }
      });
    }
  }

  // Métodos existentes
  contarUnidades(propiedadId: number): number {
    return this.unidadesPorPropiedad[propiedadId] || 0;
  }

  agregarUnidad(propiedadId: number): void {
    this.router.navigate(['/rentero/propiedades', propiedadId, 'nueva-unidad']);
  }

  navegarAFormulario(): void {
    this.router.navigate(['/rentero/formulario']);
  }

  editarPropiedad(propiedadId: number): void {
    this.router.navigate(['/rentero/formulario', propiedadId]);
  }

  eliminarPropiedad(propiedadId: number): void {
    if (confirm('¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      console.log('Eliminar propiedad:', propiedadId);
    }
  }

  trackByPropiedadId(index: number, propiedad: PropiedadBackend): number {
    return propiedad?.id || index;
  }

  trackByUnidadId(index: number, unidad: Unidad): number {
    return unidad?.id || index;
  }

  // Método para formatear precio
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  // Método para obtener servicios como string
  obtenerServicios(unidad: Unidad): string {
    if (unidad.descripcion && unidad.descripcion.servicios) {
      return unidad.descripcion.servicios.join(', ');
    }
    return 'Sin servicios especificados';
  }
}
