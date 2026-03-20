import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import HabitDetail from './pages/HabitDetail';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

function AppRoutes() {
  const { onboardingDone } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {!onboardingDone ? (
        <Route path="*" element={<Onboarding />} />
      ) : (
        <>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habit/:id" element={<HabitDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
