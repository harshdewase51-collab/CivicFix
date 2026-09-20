import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportProblemPage from './pages/ReportProblemPage';
import MyReportsPage from './pages/MyReportsPage';
import ReportDetailsPage from './pages/ReportDetailsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReportDetailsPage from './pages/AdminReportDetailsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Citizen Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/report" element={<ReportProblemPage />} />
              <Route path="/reports" element={<MyReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailsPage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reports/:id" element={<AdminReportDetailsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
