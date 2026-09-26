import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DonorDashboardPage from './pages/donor/DonorDashboardPage';
import CreateDonationPage from './pages/donor/CreateDonationPage';
import DonationsListPage from './pages/donor/DonationsListPage';
import ShelterDashboardPage from './pages/shelter/ShelterDashboardPage';
import ShelterMatchesPage from './pages/shelter/ShelterMatchesPage';
import ShelterCapacityPage from './pages/shelter/ShelterCapacityPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import DriverDeliveriesPage from './pages/driver/DriverDeliveriesPage';
import ImpactDashboardPage from './pages/impact/ImpactDashboardPage';
import PublicFoodRequestPage from './pages/public/PublicFoodRequestPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Root redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Standalone Login Screen */}
      <Route path="/login" element={<LoginPage />} />

      {/* Standalone Signup Screen */}
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* Standalone Public Food Request Form */}
      <Route path="/request-food" element={<PublicFoodRequestPage />} />

      {/* Application Shell with Shared Layout & Protected Portals */}
      <Route element={<Layout />}>
        {/* Donor Routes (Protected: Donor & Admin) */}
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/create-donation"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <CreateDonationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/donations"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonationsListPage />
            </ProtectedRoute>
          }
        />

        {/* Shelter Routes (Protected: Shelter & Admin) */}
        <Route
          path="/shelter"
          element={
            <ProtectedRoute allowedRoles={['shelter']}>
              <ShelterDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/matches"
          element={
            <ProtectedRoute allowedRoles={['shelter']}>
              <ShelterMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shelter/capacity"
          element={
            <ProtectedRoute allowedRoles={['shelter']}>
              <ShelterCapacityPage />
            </ProtectedRoute>
          }
        />

        {/* Driver Routes (Protected: Driver & Admin) */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/deliveries"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDeliveriesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin / Impact Route (Protected: Admin Only) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ImpactDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
