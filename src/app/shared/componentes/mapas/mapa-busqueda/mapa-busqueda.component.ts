import { Component, Input, ElementRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation, HostListener } from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatBounds } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { UniversidadService } from '../../../../core/universidad.service';
import { UniversidadBasica } from '../../../../interfaces/universidad.interface';

type Coords = [number, number];

@Component({
  selector: 'app-mapa-busqueda',
  templateUrl: './mapa-busqueda.component.html',
  styleUrls: ['./mapa-busqueda.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapaBusquedaComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propiedades: any[] = [];
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: MapboxMap;
  private markers: Marker[] = [];

  private uniMarkers: Marker[] = [];
  private universidadesCache: UniversidadBasica[] = [];
  private moveDebounce?: any;
  private readonly DEBOUNCE_MS = 200;
  private readonly MIN_ZOOM_TO_RENDER_UNIS = 9;

  isMapLoading = true;
  isDataLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private universidadSrv: UniversidadService
  ) {}

  @HostListener('window:resize')
  onWinResize() {
    this.map?.resize();
  }

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.isMapLoading = true;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-99.1332, 19.4326],
      zoom: 11
    });

    // Controles de navegación (+/-)
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      // Evita que el mapa “agarre” el scroll al pasar por encima
      this.map!.scrollZoom.disable();
      // Permite zoom solo si el usuario mantiene Ctrl (mejor UX)
      this.map!.getCanvas().addEventListener('wheel', (e: WheelEvent) => {
        if (e.ctrlKey) {
          this.map!.scrollZoom.enable();
        } else {
          this.map!.scrollZoom.disable();
        }
      }, { passive: true });

      this.renderMarkers();
      this.initUniversidadesLayer();
      setTimeout(() => this.map?.resize(), 0);
      this.isMapLoading = false;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['propiedades']) {
      this.renderMarkers();
    }
  }

  private renderMarkers(): void {
    if (!this.map) return;
    this.isDataLoading = true;

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const groups = this.groupByCoordinates(this.propiedades);

    if (groups.length === 0) {
      this.isDataLoading = false;
      return;
    }

    const bounds = new LngLatBounds();

    for (const g of groups) {
      const el = document.createElement('div');
      el.classList.add('mapboxgl-marker', 'marker-home');

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(g.coords);

      const count = g.items.length;

      if (count > 1) {
        el.classList.add('has-badge');
        el.setAttribute('data-count', String(count));
        el.setAttribute('title', `${count} propiedades en esta ubicación`);
      } else {
        el.classList.remove('has-badge');
        el.removeAttribute('data-count');
        el.removeAttribute('title');
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: [0, -36],
        anchor: 'bottom',
        className: 'prop-popup'
      }).setHTML(this.buildPopupHTML(g.items));

      marker.setPopup(popup);

      el.addEventListener('click', () => {
        if (!this.map) return;
        const current = this.map.getZoom();
        const desired = count > 1 ? Math.max(current + 2, 14) : Math.max(current + 1, 13);
        const targetZoom = Math.min(desired, 18);

        this.map.easeTo({
          center: g.coords as mapboxgl.LngLatLike,
          zoom: targetZoom,
          duration: 500,
        });

        marker.togglePopup();
      }, { passive: true });

      marker.addTo(this.map!);
      this.markers.push(marker);
      bounds.extend(g.coords);
    }

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
      setTimeout(() => this.map?.resize(), 0);
    }

    setTimeout(() => this.isDataLoading = false, 300);
  }

  private groupByCoordinates(items: any[]): { coords: Coords; items: any[] }[] {
    const map = new Map<string, { coords: Coords; items: any[] }>();
    for (const it of (items || [])) {
      const coords: number[] | undefined = it?.ubicacion?.coordenadas?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;

      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isNaN(lng) || Number.isNaN(lat)) continue;

      const key = `${lng}|${lat}`;
      if (!map.has(key)) {
        map.set(key, { coords: [lng, lat], items: [it] });
      } else {
        map.get(key)!.items.push(it);
      }
    }
    return Array.from(map.values());
  }

  private buildPopupHTML(items: any[]): string {
    if (items.length === 1) {
      const p = items[0];
      const nombre = this.escapeHtml(p?.nombre || 'Departamento');
      const precio = this.formatMoney(p?.precio);
      const id = p?.id;

      return `
      <div class="pp-list">
        <ul>
          <li class="pp-item">
            <a href="#" class="pp-item-title pp-nav" data-id="${id}">${nombre}</a>
            <span class="pp-item-price">${precio}/mes</span>
          </li>
        </ul>
      </div>`;
    } else {
      const maxShow = 8;
      const list = items.slice(0, maxShow).map((p: any) => {
        const nombre = this.escapeHtml(p?.nombre || 'Depto');
        const precio = this.formatMoney(p?.precio);
        const id = p?.id;
        return `
        <li class="pp-item">
          <a href="#" class="pp-item-title pp-nav" data-id="${id}">${nombre}</a>
          <span class="pp-item-price">${precio}/mes</span>
        </li>`;
      }).join('');

      const extra = items.length > maxShow
        ? `<div class="pp-more">+${items.length - maxShow} más en esta ubicación</div>`
        : '';

      return `<div class="pp-list"><ul>${list}</ul>${extra}</div>`;
    }
  }

  private initUniversidadesLayer(): void {
    if (!this.map) return;

    this.isDataLoading = true;
    this.universidadSrv.obtenerUniversidades().subscribe({
      next: (resp) => {
        this.universidadesCache = resp.data ?? [];
        this.renderUniversidadesInView();

        this.map!.on('moveend', () => {
          if (this.moveDebounce) clearTimeout(this.moveDebounce);
          this.moveDebounce = setTimeout(() => this.renderUniversidadesInView(), this.DEBOUNCE_MS);
        });
      },
      error: (err) => {
        console.error('Error cargando universidades', err);
        this.isDataLoading = false;
      }
    });
  }

  private renderUniversidadesInView(): void {
    if (!this.map) return;

    this.uniMarkers.forEach(m => m.remove());
    this.uniMarkers = [];

    const zoom = this.map.getZoom();
    if (zoom < this.MIN_ZOOM_TO_RENDER_UNIS) {
      this.isDataLoading = false;
      return;
    }

    const bounds = this.map?.getBounds();
    if (!bounds) {
      this.isDataLoading = false;
      return;
    }

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const minLng = Math.min(sw.lng, ne.lng);
    const maxLng = Math.max(sw.lng, ne.lng);
    const minLat = Math.min(sw.lat, ne.lat);
    const maxLat = Math.max(sw.lat, ne.lat);

    const visibles = this.universidadesCache.filter(u => {
      const [lng, lat] = u.coordenadas || [];
      if (lng == null || lat == null) return false;
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    });

    for (const u of visibles) {
      const el = document.createElement('div');
      el.classList.add('mapboxgl-marker', 'marker-uni');
      el.setAttribute('title', u.nombre);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(u.coordenadas as [number, number]);

      marker.addTo(this.map!);
      this.uniMarkers.push(marker);
    }

    setTimeout(() => this.isDataLoading = false, 150);
  }

  private formatMoney(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  }

  private escapeHtml(s: string): string {
    return String(s).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    } as any)[m]);
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    this.uniMarkers.forEach(m => m.remove());
    this.map?.remove();
  }
}
