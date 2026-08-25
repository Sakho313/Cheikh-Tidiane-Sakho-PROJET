import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM, type FleetMapProps } from '@/lib/maps/types';

/** Fournisseur Mapbox (nécessite VITE_MAPBOX_TOKEN). */
export default function MapboxMap({
  markers = [],
  polylines = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className = '',
  onMarkerClick,
}: FleetMapProps): JSX.Element {
  const token = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
  const lineData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: polylines.map((pl) => ({
      type: 'Feature',
      properties: { color: pl.color ?? '#2563eb' },
      geometry: { type: 'LineString', coordinates: pl.points.map((p) => [p.lng, p.lat]) },
    })),
  };

  return (
    <div
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            longitude={m.lng}
            latitude={m.lat}
            color={m.color ?? '#2563eb'}
            onClick={() => onMarkerClick?.(m.id)}
          />
        ))}
        {polylines.length > 0 && (
          <Source id="fleet-lines" type="geojson" data={lineData}>
            <Layer
              id="fleet-lines-layer"
              type="line"
              paint={{ 'line-color': ['get', 'color'], 'line-width': 4 }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
