import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityPortal from "./pages/CommunityPortal";
import SurveyPage from "./pages/SurveyPage";
import LoginPage from "./pages/LoginPage";

// Animated background – unchanged (works fine on mobile)
function AnimatedBackground() { /* ... same as before ... */ return null; }

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedBackground />
        <div className="pb-safe"> {/* adds bottom safe area padding */}
          <Routes>
            <Route path="/" element={<CommunityPortal />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/survey/:id" element={<SurveyPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}