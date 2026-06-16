import { useState, type FormEvent, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { risksApi } from '@/api/risks';
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
  riskCategoryLabels,
  riskStatusLabels,
  riskStatusTone,
  riskLevelLabels,
} from '@/lib/labels';
import type { RiskCategory, RiskLevel, RiskMatrixCell, RiskPayload } from '@/types';

const CATEGORIES = Object.keys(riskCategoryLabels) as RiskCategory[];
const SCALE = [1, 2, 3, 4, 5];

const levelCellClass: Record<RiskLevel, string> = {
  LOW: 'bg-green-200 text-green-900',
  MEDIUM: 'bg-yellow-200 text-yellow-900',
  HIGH: 'bg-orange-300 text-orange-900',
  CRITICAL: 'bg-red-300 text-red-900',
};

const initialForm = () => ({
  title: '',
  description: '',
  category: 'NETWORK' as RiskCategory,
  likelihood: 3,
  impact: 3,
  mitigationPlan: '',
});

export function RisksPage() {
  const [orgId, setOrgId] = useSelectedOrg();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const matrixQuery = useQuery({
    queryKey: ['risk-matrix', orgId],
    queryFn: () => risksApi.getMatrix(orgId as string),
    enabled: Boolean(orgId),
  });

  const listQuery = useQuery({
    queryKey: ['risks', orgId],
    queryFn: () => risksApi.list(orgId as string, { limit: 100 }),
    enabled: Boolean(orgId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: RiskPayload) => risksApi.create(payload),
    onSuccess: () => {
      setFormError(null);
      setShowForm(false);
      setForm(initialForm);
      void queryClient.invalidateQueries({ queryKey: ['risks', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['risk-matrix', orgId] });
    },
    onError: (err) => setFormError(extractErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      organizationId: orgId as string,
      title: form.title,
      description: form.description,
      category: form.category,
      likelihood: form.likelihood,
      impact: form.impact,
      mitigationPlan: form.mitigationPlan.trim() || undefined,
    });
  };

  const cellByCoord = useMemo(() => {
    const map = new Map<string, RiskMatrixCell>();
    (matrixQuery.data?.matrix ?? []).flat().forEach((cell) => {
      map.set(`${cell.likelihood}-${cell.impact}`, cell);
    });
    return map;
  }, [matrixQuery.data]);

  const summary = matrixQuery.data?.summary;
  const risks = listQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Gestion des risques"
        description="Matrice 5×5 (probabilité × impact) et registre des risques"
        actions={
          <>
            <OrgSelector value={orgId} onChange={setOrgId} />
            {orgId && (
              <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Fermer' : 'Nouveau risque'}
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
            <Card title="Enregistrer un risque" className="mb-6">
              {formError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="risk-title" className="form-label">Titre</label>
                  <input
                    id="risk-title"
                    required
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="risk-category" className="form-label">Catégorie</label>
                  <select
                    id="risk-category"
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as RiskCategory })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {riskCategoryLabels[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="risk-likelihood" className="form-label">Probabilité (1-5)</label>
                    <select
                      id="risk-likelihood"
                      className="form-input"
                      value={form.likelihood}
                      onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}
                    >
                      {SCALE.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="risk-impact" className="form-label">Impact (1-5)</label>
                    <select
                      id="risk-impact"
                      className="form-input"
                      value={form.impact}
                      onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                    >
                      {SCALE.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="risk-description" className="form-label">Description</label>
                  <textarea
                    id="risk-description"
                    required
                    rows={3}
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="risk-mitigation" className="form-label">
                    Plan de mitigation{' '}
                    <span className="font-normal text-gray-400">(optionnel)</span>
                  </label>
                  <textarea
                    id="risk-mitigation"
                    rows={2}
                    className="form-input"
                    value={form.mitigationPlan}
                    onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <Button type="submit" isLoading={createMutation.isPending}>
                    Enregistrer
                  </Button>
                  <span className="text-sm text-gray-500">
                    Score calculé : {form.likelihood * form.impact} / 25
                  </span>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total risques" value={summary?.total ?? 0} />
            <StatCard label="Critiques" value={summary?.critical ?? 0} accent="text-red-600" />
            <StatCard label="Élevés" value={summary?.high ?? 0} accent="text-orange-500" />
            <StatCard label="Moyens" value={summary?.medium ?? 0} accent="text-yellow-600" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Matrice des risques">
              {matrixQuery.isLoading ? (
                <LoadingBlock />
              ) : (
                <div>
                  <div className="flex">
                    <div className="flex items-center">
                      <span className="-rotate-90 whitespace-nowrap text-xs font-semibold text-gray-500">
                        Impact →
                      </span>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((impact) => (
                        <div key={impact} className="flex">
                          <div className="flex w-6 items-center justify-center text-xs font-medium text-gray-400">
                            {impact}
                          </div>
                          {SCALE.map((likelihood) => {
                            const cell = cellByCoord.get(`${likelihood}-${impact}`);
                            const level: RiskLevel = cell?.level ?? 'LOW';
                            return (
                              <div
                                key={likelihood}
                                title={`Probabilité ${likelihood} × Impact ${impact} — ${riskLevelLabels[level]}`}
                                className={`m-0.5 flex h-12 flex-1 flex-col items-center justify-center rounded ${levelCellClass[level]}`}
                              >
                                <span className="text-sm font-bold">{cell?.count ?? 0}</span>
                                <span className="text-[10px] opacity-70">{likelihood * impact}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <div className="flex">
                        <div className="w-6" />
                        {SCALE.map((likelihood) => (
                          <div
                            key={likelihood}
                            className="flex-1 text-center text-xs font-medium text-gray-400"
                          >
                            {likelihood}
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 text-center text-xs font-semibold text-gray-500">
                        Probabilité →
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Répartition par catégorie">
              {matrixQuery.data && matrixQuery.data.byCategory.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {matrixQuery.data.byCategory.map((c) => (
                    <li key={c.category} className="flex items-center justify-between">
                      <span className="text-gray-700">{riskCategoryLabels[c.category]}</span>
                      <span className="font-medium text-gray-600">
                        {c.count} · score moyen {c.avgScore}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée.</p>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-600">Registre des risques</h2>
            {listQuery.isLoading ? (
              <LoadingBlock />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Titre</TH>
                    <TH>Catégorie</TH>
                    <TH>Prob.</TH>
                    <TH>Impact</TH>
                    <TH>Score</TH>
                    <TH>Statut</TH>
                  </TR>
                </THead>
                <TBody>
                  {risks.length === 0 ? (
                    <EmptyRow colSpan={6} message="Aucun risque enregistré." />
                  ) : (
                    risks.map((risk) => (
                      <TR key={risk.id} className="hover:bg-gray-50">
                        <TD className="font-medium text-gray-800">{risk.title}</TD>
                        <TD className="text-gray-600">{riskCategoryLabels[risk.category]}</TD>
                        <TD>{risk.likelihood}</TD>
                        <TD>{risk.impact}</TD>
                        <TD className="font-semibold text-gray-800">{risk.riskScore}</TD>
                        <TD>
                          <Badge tone={riskStatusTone[risk.status]}>
                            {riskStatusLabels[risk.status]}
                          </Badge>
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
