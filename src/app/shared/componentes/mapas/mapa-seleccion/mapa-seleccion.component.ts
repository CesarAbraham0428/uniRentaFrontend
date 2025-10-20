import {
  Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, Input, OnChanges, SimpleChanges
} from '@angular/core';
import mapboxgl, { Map, Marker, LngLatLike } from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mapa-seleccion',
  templateUrl: './mapa-seleccion.component.html',
  styleUrls: ['./mapa-seleccion.component.scss']
})
export class MapaSeleccionComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  /** Coordenadas iniciales opcionales [lng, lat] */
  @Input() initialCoords: [number, number] | null = null;

  /** Texto de búsqueda proveniente del formulario (calle/colonia/CP/municipio/estado) */
  @Input() searchText: string | null = null;

  /** Emite cada vez que se confirma/ajusta la ubicación */
  @Output() coordenadasChange = new EventEmitter<{ lng: number; lat: number }>();

  private map?: Map;
  private marker?: Marker;
  private geocoder?: MapboxGeocoder;

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    const startCenter: LngLatLike = this.initialCoords ?? [-99.1332, 19.4326]; // CDMX
    const startZoom = this.initialCoords ? 16 : 12;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: startCenter,
      zoom: startZoom
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    // Geocoder "silencioso" (lo usamos programáticamente)
    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      language: 'es',
      countries: 'mx',
      proximity: { longitude: -99.1332, latitude: 19.4326 }
    });

    // Lo añadimos y lo ocultamos vía CSS (no mostramos barra en el mapa)
    this.map.addControl(this.geocoder, 'top-left');

    this.geocoder.on('result', (e: any) => {
      const center = e?.result?.center as [number, number] | undefined;
      if (!center || !this.map) return;
      this.setMarker(center);
      this.map.flyTo({ center, zoom: 16 });
      this.emitCurrentCoords();
    });

    if (this.initialCoords) this.setMarker(this.initialCoords);

    // También permitimos click en el mapa para mover el pin
    this.map.on('click', (ev) => {
      const lngLat: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
      this.setMarker(lngLat);
      this.emitCurrentCoords();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchText']) {
      const q = (this.searchText ?? '').trim();
      if (q.length > 0 && this.geocoder) {
        this.geocoder.query(q);
      }
    }
  }


  private setMarker(coords: [number, number]) {
    if (!this.map) return;

    if (!this.marker) {
      this.marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(coords)
        .addTo(this.map);
      this.marker.on('dragend', () => this.emitCurrentCoords());
    } else {
      this.marker.setLngLat(coords);
    }
  }

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
