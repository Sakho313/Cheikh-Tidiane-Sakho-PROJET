import { GoogleMap as GMap, useJsApiLoader, MarkerF, PolylineF } from '@react-google-maps/api';
import { DEFAULT_CENTER, DEFAULT_ZOOM, type FleetMapProps } from '@/lib/maps/types';

/** Fournisseur Google Maps (nécessite VITE_GOOGLE_MAPS_KEY). */
export default function GoogleMap({
  markers = [],
  polylines = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className = '',
  onMarkerClick,
}: FleetMapProps): JSX.Element {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
  });

  const wrapStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
  } as const;

  if (!isLoaded) {
    return (
      <div className={className} style={wrapStyle}>
        <div className="grid h-full place-items-center text-sm text-slate-400">
          Chargement de la carte…
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapStyle}>
      <GMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: center.lat, lng: center.lng }}
        zoom={zoom}
      >
        {markers.map((m) => (
          <MarkerF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
            onClick={() => onMarkerClick?.(m.id)}
          />
        ))}
        {polylines.map((pl) => (
          <PolylineF
            key={pl.id}
            path={pl.points.map((p) => ({ lat: p.lat, lng: p.lng }))}
            options={{ strokeColor: pl.color ?? '#2563eb', strokeWeight: 4 }}
          />
        ))}
      </GMap>
    </div>
  );
}
