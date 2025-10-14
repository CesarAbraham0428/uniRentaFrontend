import { Component, OnInit } from '@angular/core';
import { Propiedad, PropiedadService } from '../../../../core/propiedad.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  propiedades: Propiedad[] = [];
  cargando: boolean = false;
  error: string = '';

  // Filtros básicos
  precioMin: number | null = null;
  precioMax: number | null = null;
  colonia: string = '';

  // Nuevos filtros
  municipio: string = '';
  universidadNombre: string = '';
  rangoKm: number | null = null;

  constructor(private propiedadService: PropiedadService) { }

  ngOnInit(): void {
    this.cargarPropiedades();
  }

  cargarPropiedades(): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedades().subscribe({
      next: (response) => {
        console.log(' Respuesta del backend:', response);

        if (response.success && response.data) {
          this.propiedades = response.data;
          console.log(`Se cargaron ${this.propiedades.length} propiedades`);
        } else {
          this.error = 'No se pudieron cargar las propiedades.';
          this.propiedades = [];
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar propiedades:', err);

        if (err.error?.mensaje) {
          this.error = err.error.mensaje;
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000';
        } else if (err.status === 404) {
          this.error = 'Endpoint no encontrado. Verifica la ruta de la API.';
        } else if (err.status === 500) {
          this.error = 'Error en el servidor. Revisa los logs del backend.';
        } else {
          this.error = 'Error al cargar las propiedades. Por favor, intenta de nuevo.';
        }

        this.propiedades = [];
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';

    // Construir objeto de filtros solo con valores válidos
    const filtros: any = {};

    if (this.precioMin !== null && this.precioMin > 0) {
      filtros.precioMin = this.precioMin;
    }
    if (this.precioMax !== null && this.precioMax > 0) {
      filtros.precioMax = this.precioMax;
    }
    if (this.colonia && this.colonia.trim() !== '') {
      filtros.colonia = this.colonia.trim();
    }
    if (this.municipio && this.municipio.trim() !== '') {
      filtros.municipio = this.municipio.trim();
    }
    if (this.universidadNombre && this.universidadNombre.trim() !== '') {
      filtros.universidadNombre = this.universidadNombre.trim();

      // Solo agregar rangoKm si hay universidad seleccionada
      if (this.rangoKm !== null && this.rangoKm > 0) {
        filtros.rangoKm = this.rangoKm;
      } else {
        // Si no hay rango, usar 2km por defecto
        filtros.rangoKm = 2;
      }
    }

    console.log('🔍 Aplicando filtros:', filtros);

    this.propiedadService.filtrarPropiedades(filtros).subscribe({
      next: (response) => {
        console.log('Respuesta de filtros:', response);

        if (response.success && response.data) {
          this.propiedades = response.data;

          if (this.propiedades.length === 0) {
            console.log('No se encontraron propiedades con esos filtros');
          } else {
            console.log(`Se encontraron ${this.propiedades.length} propiedades`);
          }
        } else {
          this.error = 'No se pudieron filtrar las propiedades.';
          this.propiedades = [];
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al filtrar propiedades:', err);

        if (err.error?.mensaje) {
          this.error = err.error.mensaje;
        } else if (err.status === 0) {
          this.error = '🔌 No se puede conectar con el servidor.';
        } else {
          this.error = 'Error al filtrar las propiedades. Por favor, intenta de nuevo.';
        }

        this.propiedades = [];
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    console.log('🧹 Limpiando filtros...');
    this.precioMin = null;
    this.precioMax = null;
    this.colonia = '';
    this.municipio = '';
    this.universidadNombre = '';
    this.rangoKm = null;
    this.cargarPropiedades();
  }

  contactarRentero(telefono: string | undefined): void {
    if (!telefono) {
      return;
    }

    const telefonoLimpio = telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent('Hola, me interesa una de tus propiedades en UniRenta 🏠');
    const url = `https://wa.me/52${telefonoLimpio}?text=${mensaje}`;

    console.log('📱 Abriendo WhatsApp:', url);
    window.open(url, '_blank');
  }
}
