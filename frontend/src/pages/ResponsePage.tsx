import { useQuery } from '@tanstack/react-query';
import { incidentsApi } from '@/api/incidents';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  incidentSeverityLabels,
  incidentSeverityTone,
  incidentStatusLabels,
  incidentStatusTone,
  formatDateTime,
} from '@/lib/labels';

export function ResponsePage() {
  const [orgId, setOrgId] = useSelectedOrg();

  const listQuery = useQuery({
    queryKey: ['incidents', orgId],
    queryFn: () => incidentsApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const incidents = (listQuery.data?.data ?? []).filter(
    (i) =>
      i.status === 'INVESTIGATING' ||
      i.status === 'REPORTED_INITIAL' ||
      i.status === 'REPORTED_FINAL' ||
      i.status === 'RESOLVED',
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Réponse à incident"
          description="Suivi des incidents en cours d'investigation et de remédiation"
        />
        <OrgSelector value={orgId} onChange={setOrgId} />
      </div>

      {!orgId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Sélectionnez une organisation.</p>
        </div>
      ) : listQuery.isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          {/* NIS2 reporting timeline reminder */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                delay: '24 h',
                label: 'Notification initiale',
                desc: "Alerte précoce à l'autorité compétente",
                color: 'border-amber-400 bg-amber-50',
                textColor: 'text-amber-700',
              },
              {
                delay: '72 h',
                label: 'Rapport intermédiaire',
                desc: 'Évaluation initiale avec gravité',
                color: 'border-orange-400 bg-orange-50',
                textColor: 'text-orange-700',
              },
              {
                delay: '1 mois',
                label: 'Rapport final',
                desc: 'Rapport complet avec analyse des causes',
                color: 'border-red-400 bg-red-50',
                textColor: 'text-red-700',
              },
            ].map((step) => (
              <div key={step.delay} className={`rounded-xl border-l-4 p-4 shadow-sm ${step.color}`}>
                <p className={`text-2xl font-bold ${step.textColor}`}>{step.delay}</p>
                <p className="font-semibold text-slate-700 text-sm">{step.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">
                Incidents actifs ({incidents.length})
              </h2>
            </div>
            {listQuery.isLoading ? (
              <div className="p-4">
                <LoadingBlock />
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Sévérité</TH>
                    <TH>Statut</TH>
                    <TH>Systèmes affectés</TH>
                    <TH>Détecté le</TH>
                    <TH>Autorité</TH>
                  </TR>
                </THead>
                <TBody>
                  {incidents.length === 0 ? (
                    <EmptyRow colSpan={6} message="Aucun incident actif en réponse." />
                  ) : (
                    incidents.map((incident) => (
                      <TR key={incident.id} className="hover:bg-slate-50">
                        <TD className="font-medium text-slate-800">{incident.title}</TD>
                        <TD>
                          <Badge tone={incidentSeverityTone[incident.severity]}>
                            {incidentSeverityLabels[incident.severity]}
                          </Badge>
                        </TD>
                        <TD>
                          <Badge tone={incidentStatusTone[incident.status]}>
                            {incidentStatusLabels[incident.status]}
                          </Badge>
                        </TD>
                        <TD className="text-slate-600 text-xs">
                          {incident.affectedSystems.join(', ') || '—'}
                        </TD>
                        <TD className="whitespace-nowrap text-slate-600 text-xs">
                          {formatDateTime(incident.detectedAt)}
                        </TD>
                        <TD>
                          {incident.reportedToAuthority ? (
                            <Badge tone="green">Notifiée</Badge>
                          ) : (
                            <Badge tone="red">Non notifiée</Badge>
                          )}
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
