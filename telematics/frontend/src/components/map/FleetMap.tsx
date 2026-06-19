import { lazy, Suspense } from 'react';
import { resolveProvider, type FleetMapProps } from '@/lib/maps/types';

// Chargement paresseux : chaque fournisseur (et sa lib : leaflet / mapbox-gl /
// google maps) forme un chunk asynchrone séparé, téléchargé uniquement si ce
// fournisseur est sélectionné. Le bundle initial n'embarque donc plus mapbox-gl
// (~510 Ko gzip) quand on utilise Leaflet par défaut.
const LeafletMap = lazy(() => import('./LeafletMap'));
const MapboxMap = lazy(() => import('./MapboxMap'));
const GoogleMap = lazy(() => import('./GoogleMap'));

/**
 * Carte de flotte agnostique du fournisseur. Choisit l'implémentation selon
 * `VITE_MAP_PROVIDER` (leaflet par défaut ; mapbox/google si une clé est
 * configurée). Les pages utilisent uniquement ce composant.
 */
export default function FleetMap(props: FleetMapProps): JSX.Element {
  const provider = resolveProvider();
  const Map = provider === 'mapbox' ? MapboxMap : provider === 'google' ? GoogleMap : LeafletMap;
  const height = typeof props.height === 'number' ? `${props.height}px` : (props.height ?? '100%');

  return (
    <Suspense
      fallback={
        <div
          className={`flex items-center justify-center bg-slate-100 text-sm text-slate-400 ${props.className ?? ''}`}
          style={{ height }}
        >
          Chargement de la carte…
        </div>
      }
    >
      <Map {...props} />
    </Suspense>
  );
}
