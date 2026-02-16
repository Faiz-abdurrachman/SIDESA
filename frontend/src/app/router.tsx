import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PendudukPage } from '../pages/PendudukPage';
import { KartuKeluargaPage } from '../pages/KartuKeluargaPage';
import { SuratPage } from '../pages/SuratPage';
import { SuratCreatePage } from '../pages/SuratCreatePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="penduduk" element={<PendudukPage />} />
          <Route path="kk" element={<KartuKeluargaPage />} />
          <Route path="surat" element={<SuratPage />} />
          <Route path="surat/create" element={<SuratCreatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
