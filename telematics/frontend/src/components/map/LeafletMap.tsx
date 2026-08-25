import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM, type FleetMapProps } from '@/lib/maps/types';

/**
 * Fournisseur de carte par défaut — Leaflet + OpenStreetMap (gratuit, sans clé).
 * Implémenté directement sur l'API `leaflet` (pas de wrapper react-leaflet).
 */
export default function LeafletMap({
  markers = [],
  polylines = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className = '',
  onMarkerClick,
}: FleetMapProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Initialisation unique de la carte.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour des marqueurs et tracés.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    for (const m of markers) {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 7,
        color: m.color ?? '#2563eb',
        fillColor: m.color ?? '#2563eb',
        fillOpacity: 0.9,
        weight: 2,
      });
      if (m.popup) marker.bindPopup(m.popup);
      else if (m.label) marker.bindTooltip(m.label);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(m.id));
      marker.addTo(layer);
      bounds.push([m.lat, m.lng]);
    }

    for (const pl of polylines) {
      if (pl.points.length === 0) continue;
      const latlngs = pl.points.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      L.polyline(latlngs, { color: pl.color ?? '#2563eb', weight: 4 }).addTo(layer);
      bounds.push(...latlngs);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 15 });
    }
  }, [markers, polylines, onMarkerClick]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    />
  );
}
