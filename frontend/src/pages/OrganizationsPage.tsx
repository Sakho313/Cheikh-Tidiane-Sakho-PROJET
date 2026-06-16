import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';
import { extractErrorMessage } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import {
  entityTypeLabels,
  sectorLabels,
  formatDate,
} from '@/lib/labels';
import type { EntityType, Organization, OrganizationPayload, Sector } from '@/types';

const SECTORS = Object.keys(sectorLabels) as Sector[];
const ENTITY_TYPES = Object.keys(entityTypeLabels) as EntityType[];

const emptyForm: OrganizationPayload = {
  name: '',
  sector: 'ENERGY',
  entityType: 'ESSENTIAL',
  country: '',
  contactEmail: '',
};

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OrganizationPayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['organizations', { page: 1, limit: 100 }],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  const statsQuery = useQuery({
    queryKey: ['org-stats', detailId],
    queryFn: () => organizationsApi.getStats(detailId as string),
    enabled: Boolean(detailId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: OrganizationPayload) => organizationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      ...form,
      website: form.website?.trim() ? form.website : undefined,
      contactPhone: form.contactPhone?.trim() ? form.contactPhone : undefined,
      address: form.address?.trim() ? form.address : undefined,
    });
  };

  const organizations = listQuery.data?.data ?? [];
  const selected: Organization | undefined = organizations.find((o) => o.id === detailId);

  return (
    <div>
      <PageHeader
        title="Organisations"
        description="Entités régulées sous le régime NIS2"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Fermer' : 'Nouvelle organisation'}
          </Button>
        }
      />

      {showForm && (
        <Card title="Créer une organisation" className="mb-6">
          {formError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="org-name" className="form-label">Nom</label>
              <input
                id="org-name"
                required
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="org-country" className="form-label">Pays</label>
              <input
                id="org-country"
                required
                className="form-input"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="org-sector" className="form-label">Secteur</label>
              <select
                id="org-sector"
                className="form-input"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value as Sector })}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {sectorLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="org-entity-type" className="form-label">Type d'entité</label>
              <select
                id="org-entity-type"
                className="form-input"
                value={form.entityType}
                onChange={(e) => setForm({ ...form, entityType: e.target.value as EntityType })}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {entityTypeLabels[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="org-email" className="form-label">E-mail de contact</label>
              <input
                id="org-email"
                required
                type="email"
                className="form-input"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="org-phone" className="form-label">Téléphone (optionnel)</label>
              <input
                id="org-phone"
                className="form-input"
                value={form.contactPhone ?? ''}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {listQuery.isLoading ? (
            <LoadingBlock />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nom</TH>
                  <TH>Secteur</TH>
                  <TH>Type</TH>
                  <TH>Pays</TH>
                  <TH>Créée le</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {organizations.length === 0 ? (
                  <EmptyRow colSpan={6} message="Aucune organisation enregistrée." />
                ) : (
                  organizations.map((org) => (
                    <TR key={org.id} className="hover:bg-gray-50">
                      <TD className="font-medium text-gray-900">{org.name}</TD>
                      <TD>{sectorLabels[org.sector]}</TD>
                      <TD>
                        <Badge tone={org.entityType === 'ESSENTIAL' ? 'blue' : 'gray'}>
                          {entityTypeLabels[org.entityType]}
                        </Badge>
                      </TD>
                      <TD>{org.country}</TD>
                      <TD>{formatDate(org.createdAt)}</TD>
                      <TD>
                        <Button size="sm" variant="secondary" onClick={() => setDetailId(org.id)}>
                          Détails
                        </Button>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          )}
        </div>

        <div>
          <Card title={selected ? selected.name : 'Détails'}>
            {!detailId ? (
              <p className="text-sm text-gray-400">
                Sélectionnez une organisation pour voir ses statistiques.
              </p>
            ) : statsQuery.isLoading ? (
              <LoadingBlock label="Chargement des statistiques…" />
            ) : statsQuery.data ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Score de conformité</dt>
                  <dd className="font-semibold text-gray-800">
                    {statsQuery.data.compliance.complianceScore}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Évaluations</dt>
                  <dd className="font-medium text-gray-700">
                    {statsQuery.data.compliance.totalAssessments}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Incidents</dt>
                  <dd className="font-medium text-gray-700">{statsQuery.data.incidents.total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Risques</dt>
                  <dd className="font-medium text-gray-700">{statsQuery.data.risks.total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Audits</dt>
                  <dd className="font-medium text-gray-700">{statsQuery.data.audits.total}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-400">Statistiques indisponibles.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
