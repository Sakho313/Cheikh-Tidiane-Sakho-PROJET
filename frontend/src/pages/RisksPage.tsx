import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { risksApi } from '@/api/risks';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrgSelector } from '@/components/OrgSelector';
import { LoadingBlock } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from '@/components/ui/Table';
import { useSelectedOrg } from '@/hooks/useSelectedOrg';
import {
  riskCategoryLabels,
  riskStatusLabels,
  riskStatusTone,
  riskLevelLabels,
} from '@/lib/labels';
import type { RiskLevel, RiskMatrixCell } from '@/types';

const levelCellClass: Record<RiskLevel, string> = {
  LOW: 'bg-green-200 text-green-900',
  MEDIUM: 'bg-yellow-200 text-yellow-900',
  HIGH: 'bg-orange-300 text-orange-900',
  CRITICAL: 'bg-red-300 text-red-900',
};

export function RisksPage() {
  const [orgId, setOrgId] = useSelectedOrg();

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

  // Index matrix cells by "likelihood-impact" so rendering is independent of
  // the backend's array orientation.
  const cellByCoord = useMemo(() => {
    const map = new Map<string, RiskMatrixCell>();
    (matrixQuery.data?.matrix ?? []).flat().forEach((cell) => {
      map.set(`${cell.likelihood}-${cell.impact}`, cell);
    });
    return map;
  }, [matrixQuery.data]);

  const summary = matrixQuery.data?.summary;
  const risks = listQuery.data?.data ?? [];
  const axis = [1, 2, 3, 4, 5];

  return (
    <div>
      <PageHeader
        title="Gestion des risques"
        description="Matrice 5×5 (probabilité × impact) et registre des risques"
        actions={<OrgSelector value={orgId} onChange={setOrgId} />}
      />

      {!orgId ? (
        <Card>
          <p className="text-sm text-gray-500">Sélectionnez une organisation.</p>
        </Card>
      ) : (
        <>
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
                      {/* Rows: impact 5 (top) → 1 (bottom) */}
                      {[5, 4, 3, 2, 1].map((impact) => (
                        <div key={impact} className="flex">
                          <div className="flex w-6 items-center justify-center text-xs font-medium text-gray-400">
                            {impact}
                          </div>
                          {axis.map((likelihood) => {
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
                        {axis.map((likelihood) => (
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
