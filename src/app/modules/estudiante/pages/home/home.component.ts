import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { Propiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  propiedades: Propiedad[] = [];
  cargando = false;
  error = '';

  // Filtros
  precioMin: number | null = null;
  precioMax: number | null = null;
  colonia = '';
  municipio = '';
  universidadNombre = '';
  rangoKm: number | null = null;

  currentSlide = 0;
  private carouselInterval: any;

  isSticky = false;
  private io?: IntersectionObserver;
  private sentinelVisible = true;
  private mapVisible = false;

  @ViewChild('stickySentinel') stickySentinel!: ElementRef<HTMLDivElement>;
  @ViewChild('resultsContainer') resultsRef!: ElementRef<HTMLDivElement>;
  @ViewChild('mapContainer') mapRef!: ElementRef<HTMLDivElement>;

  constructor(private propiedadService: PropiedadService) { }

  ngOnInit(): void {
    this.cargarPropiedades();
    this.startCarousel();
  }

  ngAfterViewInit(): void {
    this.initObservers();
  }

  private initObservers(): void {
    if (this.io) this.io.disconnect();

    this.io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (this.stickySentinel && target === this.stickySentinel.nativeElement) {
          this.sentinelVisible = entry.isIntersecting;
        }
        if (this.mapRef && target === this.mapRef.nativeElement) {
          this.mapVisible = entry.isIntersecting;
        }
      });
      this.isSticky = !this.sentinelVisible && !this.mapVisible;
    }, {
      root: null,
      threshold: 0,
    });

    setTimeout(() => {
      if (this.stickySentinel?.nativeElement) this.io!.observe(this.stickySentinel.nativeElement);
      if (this.mapRef?.nativeElement) this.io!.observe(this.mapRef.nativeElement);
    });
  }


  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % 3;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    clearInterval(this.carouselInterval);
    this.startCarousel();
  }

  scrollToSearch(): void {
    const searchSection = document.getElementById('searchSection');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  cargarPropiedades(): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedades().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.propiedades = response.data;
        } else {
          this.error = 'No se pudieron cargar las propiedades.';
          this.propiedades = [];
        }
        this.cargando = false;
        setTimeout(() => this.initObservers());
      },
      error: (err) => {
        if (err.error?.mensaje) this.error = err.error.mensaje;
        else if (err.status === 0) this.error = 'No se puede conectar con el servidor.';
        else if (err.status === 404) this.error = 'Endpoint no encontrado.';
        else if (err.status === 500) this.error = 'Error en el servidor.';
        else this.error = 'Error al cargar las propiedades.';

        this.propiedades = [];
        this.cargando = false;
        setTimeout(() => this.initObservers());
      }
    });
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';

    const filtros: any = {};
    if (this.precioMin !== null && this.precioMin > 0) filtros.precioMin = this.precioMin;
    if (this.precioMax !== null && this.precioMax > 0) filtros.precioMax = this.precioMax;
    if (this.colonia.trim()) filtros.colonia = this.colonia.trim();
    if (this.municipio.trim()) filtros.municipio = this.municipio.trim();
    if (this.universidadNombre.trim()) {
      filtros.universidadNombre = this.universidadNombre.trim();
      filtros.rangoKm = (this.rangoKm !== null && this.rangoKm > 0) ? this.rangoKm : 2;
    }

    this.propiedadService.filtrarPropiedades(filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.propiedades = response.data;
          if (this.propiedades.length === 0) this.isSticky = false;
        } else {
          this.error = 'No se pudieron filtrar las propiedades.';
          this.propiedades = [];
          this.isSticky = false;
        }
        this.cargando = false;
        setTimeout(() => this.initObservers());
      },
      error: () => {
        this.error = 'Error al filtrar las propiedades. Por favor, intenta de nuevo.';
        this.propiedades = [];
        this.cargando = false;
        this.isSticky = false;
        setTimeout(() => this.initObservers());
      }
    });
  }

  limpiarFiltros(): void {
    this.precioMin = null;
    this.precioMax = null;
    this.colonia = '';
    this.municipio = '';
    this.universidadNombre = '';
    this.rangoKm = null;
    this.cargarPropiedades();
  }

  contactarRentero(telefono: string | undefined): void {
    if (!telefono) return;
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent('Hola, me interesa una de tus propiedades en UniRenta 🏠');
    const url = `https://wa.me/52${telefonoLimpio}?text=${mensaje}`;
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
    if (this.io) this.io.disconnect();
  }
}	