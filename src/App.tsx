import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';
import SetPasswordPage from './components/Auth/SetPasswordPage';
import { FinanceApp } from './components/FinanceApp';

function App() {
  console.log('App renderizou');
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/set-password" element={<SetPasswordPage />} />

          {/* Rotas protegidas */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <FinanceApp />
              </ProtectedRoute>
            }
          />

          {/* Redirecionamento para landing se rota não encontrada */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;