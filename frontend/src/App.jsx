import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LostItemsPage from './pages/LostItemsPage';
import LostItemDetailPage from './pages/LostItemDetailPage';
import FoundItemsPage from './pages/FoundItemsPage';
import FoundItemDetailPage from './pages/FoundItemDetailPage';
import ReportLostPage from './pages/ReportLostPage';
import ReportFoundPage from './pages/ReportFoundPage';
import MyReportsPage from './pages/MyReportsPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Navbar across all routes */}
      <Navbar />

      {/* Main page content */}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/lost-items" element={<LostItemsPage />} />
          <Route path="/lost-items/:id" element={<LostItemDetailPage />} />
          <Route path="/found-items" element={<FoundItemsPage />} />
          <Route path="/found-items/:id" element={<FoundItemDetailPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />

          {/* Protected Routes */}
          <Route
            path="/report-lost"
            element={
              <ProtectedRoute>
                <ReportLostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-found"
            element={
              <ProtectedRoute>
                <ReportFoundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={<Navigate to="/my-reports" replace />}
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer across all routes */}
      <Footer />
    </div>
  );
}
