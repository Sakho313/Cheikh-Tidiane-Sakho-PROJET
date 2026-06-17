import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { CompliancePage } from '@/pages/CompliancePage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { RisksPage } from '@/pages/RisksPage';
import { AuditsPage } from '@/pages/AuditsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { AssetsPage } from '@/pages/AssetsPage';
import { BCPPage } from '@/pages/BCPPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { ResponsePage } from '@/pages/ResponsePage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/bcp" element={<BCPPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
