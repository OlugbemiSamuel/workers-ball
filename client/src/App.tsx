import { Routes, Route } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AdminLayout from './pages/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import GuestListPage from './pages/GuestListPage';
import AccreditPage from './pages/AccreditPage';
import ImportExportPage from './pages/ImportExportPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Routes>
      {/* Public registration route */}
      <Route path="/" element={<RegistrationPage />} />
      <Route path="/register" element={<RegistrationPage />} />

      {/* Login route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin routes (protected) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="guests" element={<GuestListPage />} />
        <Route path="accredit" element={<AccreditPage />} />
        <Route path="import-export" element={<ImportExportPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
