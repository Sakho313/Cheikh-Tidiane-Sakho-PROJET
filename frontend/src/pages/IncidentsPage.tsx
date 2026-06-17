import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/api/incidents';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import { extractErrorMessage } from '@/api/client';
import {
  incidentSeverityLabels,
  incidentSeverityTone,
  incidentStatusLabels,
  incidentStatusTone,
  formatDateTime,
} from '@/lib/labels';
import type { IncidentPayload, IncidentSeverity } from '@/types';

const SEVERITIES = Object.keys(incidentSeverityLabels) as IncidentSeverity[];

function localNow(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

const initialForm = () => ({
  title: '',
  description: '',
  severity: 'MEDIUM' as IncidentSeverity,
  incidentType: '',
  detectedAt: localNow(),
  systemsRaw: '',
});

export function IncidentsPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['incidents', orgId],
    queryFn: () => incidentsApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const statsQuery = useQuery({
    queryKey: ['incident-stats', orgId],
    queryFn: () => incidentsApi.getStats(orgId as string),
    enabled: Boolean(orgId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: IncidentPayload) => incidentsApi.create(payload),
    onSuccess: () => {
      setFormError(null);
      setShowForm(false);
      setForm(initialForm);
      void queryClient.invalidateQueries({ queryKey: ['incidents', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['incident-stats', orgId] });
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const reportMutation = useMutation({
    mutationFn: (id: string) => incidentsApi.reportToAuthority(id),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['incidents', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['incident-stats', orgId] });
    },
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const affectedSystems = form.systemsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    createMutation.mutate({
      organizationId: orgId as string,
      title: form.title,
      description: form.description,
      severity: form.severity,
      incidentType: form.incidentType,
      detectedAt: new Date(form.detectedAt).toISOString(),
      affectedSystems,
    });
  };

  const incidents = listQuery.data?.data ?? [];
  const stats = statsQuery.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Gestion de crise"
        description="Cycle de vie des incidents et notification réglementaire NIS2 Article 23"
        actions={
          <>
            <OrgSelector value={orgId} onChange={setOrgId} />
            {orgId && (
              <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Fermer' : 'Nouvel incident'}
              </Button>
            )}
          </>
        }
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : (
        <>
          {showForm && (
            <Card title="Déclarer un incident" className="mb-6">
              {formError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inc-title" className="form-label">Titre</label>
                  <input
                    id="inc-title"
                    required
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="inc-type" className="form-label">Type d&apos;incident</label>
                  <input
                    id="inc-type"
                    required
                    className="form-input"
                    placeholder="ex : Ransomware, Phishing, DDoS…"
                    value={form.incidentType}
                    onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="inc-severity" className="form-label">Sévérité</label>
                  <select
                    id="inc-severity"
                    className="form-input"
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {incidentSeverityLabels[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inc-detected" className="form-label">Détecté le</label>
                  <input
                    id="inc-detected"
                    required
                    type="datetime-local"
                    className="form-input"
                    value={form.detectedAt}
                    onChange={(e) => setForm({ ...form, detectedAt: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="inc-description" className="form-label">Description</label>
                  <textarea
                    id="inc-description"
                    required
                    rows={3}
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="inc-systems" className="form-label">
                    Systèmes affectés{' '}
                    <span className="font-normal text-gray-400">(séparés par des virgules)</span>
                  </label>
                  <input
                    id="inc-systems"
                    className="form-input"
                    placeholder="ex : serveur-mail, VPN, Active Directory"
                    value={form.systemsRaw}
                    onChange={(e) => setForm({ ...form, systemsRaw: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" isLoading={createMutation.isPending}>
                    Enregistrer
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total incidents" value={stats?.total ?? 0} />
            <StatCard
              label="Non notifiés à l'autorité"
              value={stats?.totalUnreported ?? 0}
              accent="text-orange-500"
            />
            <StatCard
              label="Critiques"
              value={stats?.bySeverity.find((s) => s.severity === 'CRITICAL')?.count ?? 0}
              accent="text-red-600"
            />
          </div>

          {actionError && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          <div className="mt-6">
            {listQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Type</TH>
                    <TH>Sévérité</TH>
                    <TH>Statut</TH>
                    <TH>Détecté le</TH>
                    <TH>Autorité</TH>
                    <TH className="text-right">Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {incidents.length === 0 ? (
                    <EmptyRow colSpan={7} message="Aucun incident enregistré." />
                  ) : (
                    incidents.map((incident) => (
                      <TR key={incident.id} className="hover:bg-gray-50">
                        <TD className="font-medium text-gray-800">{incident.title}</TD>
                        <TD className="text-gray-600">{incident.incidentType}</TD>
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
                        <TD className="whitespace-nowrap text-gray-600">
                          {formatDateTime(incident.detectedAt)}
                        </TD>
                        <TD>
                          {incident.reportedToAuthority ? (
                            <Badge tone="green">Notifiée</Badge>
                          ) : (
                            <Badge tone="gray">Non notifiée</Badge>
                          )}
                        </TD>
                        <TD className="text-right">
                          {!incident.reportedToAuthority && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={
                                reportMutation.isPending &&
                                reportMutation.variables === incident.id
                              }
                              onClick={() => reportMutation.mutate(incident.id)}
                            >
                              Notifier l&apos;autorité
                            </Button>
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
