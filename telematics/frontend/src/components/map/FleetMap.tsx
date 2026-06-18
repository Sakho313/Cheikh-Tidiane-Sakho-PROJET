import { resolveProvider, type FleetMapProps } from '@/lib/maps/types';
import LeafletMap from './LeafletMap';
import MapboxMap from './MapboxMap';
import GoogleMap from './GoogleMap';

/**
 * Carte de flotte agnostique du fournisseur. Choisit l'implémentation selon
 * `VITE_MAP_PROVIDER` (leaflet par défaut ; mapbox/google si une clé est
 * configurée). Les pages utilisent uniquement ce composant.
 */
export default function FleetMap(props: FleetMapProps): JSX.Element {
  const provider = resolveProvider();
  if (provider === 'mapbox') return <MapboxMap {...props} />;
  if (provider === 'google') return <GoogleMap {...props} />;
  return <LeafletMap {...props} />;
}
