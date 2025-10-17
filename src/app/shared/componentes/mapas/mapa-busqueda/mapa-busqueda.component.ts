import {
  Component, Input, ElementRef, ViewChild,
  OnInit, OnDestroy, OnChanges, SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatBounds } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';

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

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-99.1332, 19.4326],
      zoom: 11
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      this.renderMarkers();
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

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const groups = this.groupByCoordinates(this.propiedades);
    if (groups.length === 0) return;

    const bounds = new LngLatBounds();

    for (const g of groups) {
      // Crea el marcador con pin nativo
      const marker = new mapboxgl.Marker({ anchor: 'bottom' })
        .setLngLat(g.coords);

      const el = marker.getElement(); 

      if (g.count > 1) {
        el.classList.add('has-badge');
        el.setAttribute('data-count', String(g.count));
        el.setAttribute('title', `${g.count} propiedades en esta ubicación`);
      } else {
        el.classList.remove('has-badge');
        el.removeAttribute('data-count');
        el.removeAttribute('title');
      }

      el.addEventListener('click', () => {
        if (!this.map) return;
        const current = this.map.getZoom();
        const desired = g.count > 1 ? Math.max(current + 2, 14) : Math.max(current + 1, 13);
        const targetZoom = Math.min(desired, 18); 

        this.map.easeTo({
          center: g.coords as mapboxgl.LngLatLike,
          zoom: targetZoom,
          duration: 600,
        });
      }, { passive: true });

      marker.addTo(this.map!);

      this.markers.push(marker);
      bounds.extend(g.coords);
    }


    // Todos los marcadores
    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
    }
  }

  private groupByCoordinates(items: any[]): { coords: Coords; count: number }[] {
    const map = new Map<string, { coords: Coords; count: number }>();

    for (const it of (items || [])) {
      const coords: number[] | undefined = it?.ubicacion?.coordenadas?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;

      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isNaN(lng) || Number.isNaN(lat)) continue;

      const key = `${lng}|${lat}`;
      if (!map.has(key)) {
        map.set(key, { coords: [lng, lat], count: 1 });
      } else {
        const cur = map.get(key)!;
        cur.count += 1;
      }
    }

    return Array.from(map.values());
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    this.map?.remove();
  }
}
