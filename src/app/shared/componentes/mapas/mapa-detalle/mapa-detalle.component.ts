import { Component, Input, ElementRef, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';

@Component({
  selector: 'app-mapa-detalle',
  templateUrl: './mapa-detalle.component.html',
  styleUrl: './mapa-detalle.component.scss'
})
export class MapaDetalleComponent implements OnInit, OnDestroy, OnChanges {
  @Input() lat!: number;
  @Input() lng!: number;

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: Map;
  private propertyMarker?: Marker;
  private userMarker?: Marker;
  private watchId?: number;
  private directions?: any;
  private navStarted = false;

  constructor(private zone: NgZone) { }

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: (this.lng != null && this.lat != null) ? [this.lng, this.lat] : [-99.1332, 19.4326], // CDMX fallback
      zoom: (this.lng != null && this.lat != null) ? 15 : 12
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      this.addPropertyMarker();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['lat'] || changes['lng']) {
      this.addPropertyMarker();
      if (this.lng != null && this.lat != null) {
        this.map.flyTo({ center: [this.lng, this.lat], zoom: 15 });
      }
    }
  }

  onComoLlegar(): void {
    if (this.navStarted) return; 
    if (!this.map) return;

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    this.navStarted = true;

    if (!this.directions) {
      this.directions = new (MapboxDirections as any)({
        accessToken: environment.mapboxToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        alternatives: false,
        controls: { inputs: false, instructions: false },
        interactive: false,
        addWaypoints: false,
        clickToSetDestination: false,
        clickToSetOrigin: false
      });
      this.map.addControl(this.directions, 'bottom-right');

      if (this.lng != null && this.lat != null) {
        this.directions.setDestination([this.lng, this.lat]);
      }
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.zone.runOutsideAngular(() => {
          const origin: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          if (!this.userMarker) {
            this.userMarker = new mapboxgl.Marker().setLngLat(origin).addTo(this.map!);
          } else {
            this.userMarker.setLngLat(origin);
          }

          this.directions.setOrigin(origin);

          if (this.propertyMarker && this.map && this.userMarker) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend(this.userMarker.getLngLat());
            bounds.extend([this.lng, this.lat] as [number, number]);
            this.map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 800 });
          }
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('No pudimos obtener tu ubicación. Revisa permisos de ubicación.');
        this.navStarted = false;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  private addPropertyMarker(): void {
    if (!this.map || this.lat == null || this.lng == null) return;

    this.propertyMarker?.remove();

    this.propertyMarker = new mapboxgl.Marker({ color: '#e11d48', anchor: 'bottom' })
      .setLngLat([this.lng, this.lat])
      .setPopup(new mapboxgl.Popup().setText('Departamento'))
      .addTo(this.map);
  }

  ngOnDestroy(): void {
    if (this.watchId != null) navigator.geolocation.clearWatch(this.watchId);
    this.userMarker?.remove();
    this.propertyMarker?.remove();
    this.map?.remove();
  }
}
