import { PropiedadService } from '../../../../core/services/propiedad.service';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Propiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-propiedad-detalle',
  templateUrl: './propiedad-detalle.component.html',
  styleUrls: ['./propiedad-detalle.component.scss']
})
export class PropiedadDetalleComponent implements OnInit, OnDestroy {
  propiedad: Propiedad | null = null;
  cargando: boolean = false;
  error: string = '';
  imagenActual: number = 0;

  autoPlay: boolean = true;
  autoPlayIntervalMs: number = 10000;
  private autoTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propiedadService: PropiedadService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarPropiedad(+id);
    } else {
      this.error = 'ID de propiedad no válido';
    }
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
  }

  cargarPropiedad(id: number): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedadPorId(id).subscribe({
      next: (response) => {
        console.log('✅ Propiedad cargada:', response);

        if (response.success && response.data) {
          this.propiedad = response.data;
          this.setupAutoplay();
        } else {
          this.error = 'No se encontró la propiedad';
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar propiedad:', err);

        if (err.status === 404) this.error = 'Propiedad no encontrada';
        else if (err.status === 0) this.error = 'No se puede conectar con el servidor';
        else this.error = 'Error al cargar la propiedad';

        this.cargando = false;
      }
    });
  }

  cambiarImagen(index: number): void {
    if (this.propiedad && index >= 0 && index < this.propiedad.imagenes.length) {
      this.imagenActual = index;
      this.restartAutoplay();
    }
  }

  imagenAnterior(): void {
    if (this.propiedad) {
      this.imagenActual =
        this.imagenActual === 0
          ? this.propiedad.imagenes.length - 1
          : this.imagenActual - 1;
      this.restartAutoplay();
    }
  }

  imagenSiguiente(): void {
    if (this.propiedad) {
      this.imagenActual =
        this.imagenActual === this.propiedad.imagenes.length - 1
          ? 0
          : this.imagenActual + 1;
      this.restartAutoplay();
    }
  }

  setupAutoplay(): void {
    if (!this.autoPlay || !this.propiedad || this.propiedad.imagenes.length <= 1) {
      this.clearAutoplay();
      return;
    }
    this.clearAutoplay(); // evita múltiples timers
    this.autoTimer = setInterval(() => this.imagenSiguiente(), this.autoPlayIntervalMs);
  }

  clearAutoplay(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  restartAutoplay(): void {
    if (this.autoTimer || this.autoPlay) {
      this.setupAutoplay();
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) this.clearAutoplay();
    else this.setupAutoplay();
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

  tieneServicios(): boolean {
    return !!(
      this.propiedad?.descripcion?.servicios &&
      this.propiedad.descripcion.servicios.length > 0
    );
  }

  get propiedadLng(): number | null {
    const coords = this.propiedad?.ubicacion?.coordenadas?.coordinates;
    return Array.isArray(coords) && coords.length >= 2 ? coords[0] : null;
  }

  get propiedadLat(): number | null {
    const coords = this.propiedad?.ubicacion?.coordenadas?.coordinates;
    return Array.isArray(coords) && coords.length >= 2 ? coords[1] : null;
  }
}
