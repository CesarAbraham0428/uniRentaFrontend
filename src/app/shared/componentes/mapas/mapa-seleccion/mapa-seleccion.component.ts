import {
  Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, Input
} from '@angular/core';
import mapboxgl, { Map, Marker, LngLatLike } from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mapa-seleccion',
  templateUrl: './mapa-seleccion.component.html',
  styleUrls: ['./mapa-seleccion.component.scss']
})
export class MapaSeleccionComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  /** Coordenadas iniciales opcionales [lng, lat] (por ejemplo, último valor guardado) */
  @Input() initialCoords: [number, number] | null = null;

  /** Emite cada vez que se confirme/ajuste la ubicación (geocoder o dragend o botón) */
  @Output() coordenadasChange = new EventEmitter<{ lng: number; lat: number }>();

  private map?: Map;
  private marker?: Marker;
  private geocoder?: MapboxGeocoder;

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    const startCenter: LngLatLike = this.initialCoords ?? [-99.1332, 19.4326]; // CDMX fallback
    const startZoom = this.initialCoords ? 16 : 12;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: startCenter,
      zoom: startZoom
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    // Geocoder (barra de búsqueda)
    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl as any,
      marker: false,              // manejamos nuestro propio marcador
      language: 'es',
      placeholder: 'Buscar: calle, número, colonia, municipio…',
      countries: 'mx'             // opcional, limita a México
    });

    this.map.addControl(this.geocoder, 'top-left');

    // Cuando el usuario selecciona un resultado del geocoder
    this.geocoder.on('result', (e: any) => {
      const center = e?.result?.center as [number, number] | undefined;
      if (!center || !this.map) return;

      this.setMarker(center);
      this.map.flyTo({ center, zoom: 16 });
      this.emitCurrentCoords();
    });

    // Si hay coordenadas iniciales, pon marcador draggable
    if (this.initialCoords) {
      this.setMarker(this.initialCoords);
    }

    // Click en el mapa: mover el pin ahí (útil si el usuario prefiere clicar)
    this.map.on('click', (ev) => {
      const lngLat: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
      this.setMarker(lngLat);
      this.emitCurrentCoords();
    });
  }

  private setMarker(coords: [number, number]) {
    if (!this.map) return;

    if (!this.marker) {
      this.marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(coords)
        .addTo(this.map);

      // Cuando termina de arrastrar, informamos coordenadas
      this.marker.on('dragend', () => this.emitCurrentCoords());
    } else {
      this.marker.setLngLat(coords);
    }
  }

  /** Emite las coords actuales del marcador */
  emitCurrentCoords() {
    const pos = this.marker?.getLngLat();
    if (!pos) return;
    this.coordenadasChange.emit({ lng: pos.lng, lat: pos.lat });
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    if (this.map && this.geocoder) this.map.removeControl(this.geocoder);
    this.map?.remove();
  }
}
