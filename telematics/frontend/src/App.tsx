import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import LiveMapPage from '@/pages/LiveMapPage';
import VehiclesPage from '@/pages/VehiclesPage';
import DriversPage from '@/pages/DriversPage';
import TripsPage from '@/pages/TripsPage';
import FuelPage from '@/pages/FuelPage';
import GeofencesPage from '@/pages/GeofencesPage';
import AlertsPage from '@/pages/AlertsPage';
import ReportsPage from '@/pages/ReportsPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      {/* Page vitrine publique */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Application (protégée) sous /dashboard */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/live" element={<LiveMapPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/fuel" element={<FuelPage />} />
        <Route path="/geofences" element={<GeofencesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
