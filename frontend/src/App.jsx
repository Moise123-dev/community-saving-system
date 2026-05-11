import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LanguageSelect from './pages/LanguageSelect';
import RoleSelect from './pages/RoleSelect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Savings from './pages/Savings';
import Loans from './pages/Loans';
import Penalties from './pages/Penalties';
import Attendance from './pages/Attendance';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditTrail from './pages/AuditTrail';

// Guard: redirect to language select if no language chosen yet
function LanguageGuard({ children }) {
  const { language } = useLanguage();
  if (!language) return <Navigate to="/language" replace />;
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: '8px', fontSize: '14px' },
            }}
          />
          <Routes>
            {/* Language selection — always accessible */}
            <Route path="/language" element={<LanguageSelect />} />

            {/* All other routes require language to be chosen */}
            <Route path="/" element={<LanguageGuard><RoleSelect /></LanguageGuard>} />
            <Route path="/login" element={<LanguageGuard><Login /></LanguageGuard>} />
            <Route path="/register" element={<LanguageGuard><Register /></LanguageGuard>} />

            {/* Protected app shell */}
            <Route
              path="/app"
              element={
                <LanguageGuard>
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                </LanguageGuard>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="savings" element={<Savings />} />
              <Route path="loans" element={<Loans />} />
              <Route path="penalties" element={<Penalties />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="members" element={<ProtectedRoute managerOnly><Members /></ProtectedRoute>} />
              <Route path="accounting" element={<ProtectedRoute managerOnly><Accounting /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute managerOnly><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute managerOnly><Settings /></ProtectedRoute>} />
              <Route path="audit" element={<ProtectedRoute managerOnly><AuditTrail /></ProtectedRoute>} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
