import { PropiedadService } from '../../../../core/services/propiedad.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Propiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-propiedad-detalle',
  templateUrl: './propiedad-detalle.component.html',
  styleUrls: ['./propiedad-detalle.component.scss']
})
export class PropiedadDetalleComponent implements OnInit {
  propiedad: Propiedad | null = null;
  cargando: boolean = false;
  error: string = '';
  imagenActual: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propiedadService: PropiedadService
  ) { }

  ngOnInit(): void {
    // Obtener el ID de la URL
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarPropiedad(+id); // El + convierte string a number
    } else {
      this.error = 'ID de propiedad no válido';
    }
  }

  cargarPropiedad(id: number): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedadPorId(id).subscribe({
      next: (response) => {
        console.log('✅ Propiedad cargada:', response);

        if (response.success && response.data) {
          this.propiedad = response.data;
        } else {
          this.error = 'No se encontró la propiedad';
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar propiedad:', err);

        if (err.status === 404) {
          this.error = 'Propiedad no encontrada';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor';
        } else {
          this.error = 'Error al cargar la propiedad';
        }

        this.cargando = false;
      }
    });
  }

  cambiarImagen(index: number): void {
    if (this.propiedad && index >= 0 && index < this.propiedad.imagenes.length) {
      this.imagenActual = index;
    }
  }

  imagenAnterior(): void {
    if (this.propiedad) {
      this.imagenActual = this.imagenActual === 0
        ? this.propiedad.imagenes.length - 1
        : this.imagenActual - 1;
    }
  }

  imagenSiguiente(): void {
    if (this.propiedad) {
      this.imagenActual = this.imagenActual === this.propiedad.imagenes.length - 1
        ? 0
        : this.imagenActual + 1;
    }
  }

  contactarRentero(): void {
    if (!this.propiedad?.rentero.telefono) {
      console.warn('No hay teléfono disponible');
      return;
    }

    const telefonoLimpio = this.propiedad.rentero.telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent(
      `Hola ${this.propiedad.rentero.nombre}, me interesa tu propiedad "${this.propiedad.nombre}" en UniRenta`
    );
    const url = `https://wa.me/52${telefonoLimpio}?text=${mensaje}`;

    console.log('📱 Abriendo WhatsApp:', url);
    window.open(url, '_blank');
  }

  volver(): void {
    this.router.navigate(['/']);
  }

  // Método auxiliar para verificar si hay servicios
  tieneServicios(): boolean {
    return !!(this.propiedad?.descripcion?.servicios &&
              this.propiedad.descripcion.servicios.length > 0);
  }
}
