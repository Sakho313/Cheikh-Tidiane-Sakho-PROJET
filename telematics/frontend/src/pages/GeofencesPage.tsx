import { useQuery } from '@tanstack/react-query';
import { geofencesApi } from '@/api/geofences';
import { extractErrorMessage } from '@/api/client';
import FleetMap from '@/components/map/FleetMap';
import { PageHeader, Spinner, ErrorState, Card, Table, Th, Td, Badge, EmptyState } from '@/components/ui';
import { geofenceCategoryLabels } from '@/lib/labels';
import type { MapMarker, MapPolyline } from '@/lib/maps/types';

export default function GeofencesPage(): JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => geofencesApi.list({ limit: 100 }),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (error || !data) return <ErrorState message={extractErrorMessage(error)} />;

  const geofences = data.data;

  const markers: MapMarker[] = geofences
    .filter((g) => g.type === 'CIRCLE' && g.centerLat != null && g.centerLng != null)
    .map((g) => ({
      id: g.id,
      lat: g.centerLat as number,
      lng: g.centerLng as number,
      label: g.name,
      color: g.color,
    }));

  const polylines: MapPolyline[] = geofences
    .filter((g) => g.type === 'POLYGON' && g.polygon && g.polygon.length > 0)
    .map((g) => {
      const poly = g.polygon as Array<[number, number]>;
      const points = poly.map(([lng, lat]) => ({ lat, lng }));
      const first = poly[0];
      points.push({ lat: first[1], lng: first[0] }); // ferme le polygone
      return { id: g.id, points, color: g.color };
    });

  return (
    <div>
      <PageHeader title="Géofences" subtitle={`${geofences.length} zone(s)`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <FleetMap markers={markers} polylines={polylines} height="60vh" />
        </Card>
        <Card className="max-h-[60vh] overflow-y-auto">
          {geofences.length === 0 ? (
            <EmptyState message="Aucune géofence." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nom</Th>
                  <Th>Catégorie</Th>
                  <Th>Type</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {geofences.map((g) => (
                  <tr key={g.id}>
                    <Td className="font-medium text-slate-900">{g.name}</Td>
                    <Td>
                      <Badge>{geofenceCategoryLabels[g.category]}</Badge>
                    </Td>
                    <Td>{g.type}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
