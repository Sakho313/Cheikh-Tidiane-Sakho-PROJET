import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '@/api/vehicles';
import { extractErrorMessage } from '@/api/client';
import { PageHeader, Spinner, ErrorState, Table, Th, Td, Badge, EmptyState } from '@/components/ui';
import { vehicleStatusLabels, formatNumber } from '@/lib/labels';
import type { VehicleStatus } from '@/types';

const statusClass: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-amber-100 text-amber-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
  RETIRED: 'bg-slate-100 text-slate-500',
};

export default function VehiclesPage(): JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list({ limit: 100 }),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (error || !data) return <ErrorState message={extractErrorMessage(error)} />;

  return (
    <div>
      <PageHeader title="Véhicules" subtitle={`${data.total} véhicule(s) dans la flotte`} />
      {data.data.length === 0 ? (
        <EmptyState message="Aucun véhicule." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Immatriculation</Th>
              <Th>Marque / Modèle</Th>
              <Th>Carburant</Th>
              <Th>Odomètre</Th>
              <Th>Boîtier</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.data.map((v) => (
              <tr key={v.id}>
                <Td className="font-medium text-slate-900">{v.plate}</Td>
                <Td>{`${v.make} ${v.model}`}</Td>
                <Td>{v.fuelType}</Td>
                <Td>{formatNumber(v.odometerKm)} km</Td>
                <Td>{v.device?.serialNumber ?? '—'}</Td>
                <Td>
                  <Badge className={statusClass[v.status]}>{vehicleStatusLabels[v.status]}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
