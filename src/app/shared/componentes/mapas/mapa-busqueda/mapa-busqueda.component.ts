import { Component, Input, ElementRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation, HostListener } from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatBounds } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

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

  // Loader flags
  isMapLoading = true;
  isDataLoading = false;

  constructor(private router: Router, private route: ActivatedRoute) { }

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

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      this.renderMarkers();
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

      popup.on('open', () => {
        const popupEl = popup.getElement();
        if (!popupEl) return;
        const links = popupEl.querySelectorAll<HTMLElement>('.pp-nav');
        links.forEach(link => {
          link.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const id = (ev.currentTarget as HTMLElement).dataset['id'];
            if (id) {
              this.router.navigate(['propiedad', id], { relativeTo: this.route });
              popup.remove();
            }
          }, { once: true });
        });
      });

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
    this.map?.remove();
  }
}
