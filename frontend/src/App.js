import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import CalendarView from "@/pages/CalendarView";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HistoryPage from "@/pages/HistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import UrlGeneratorPage from "@/pages/UrlGeneratorPage";
import UrlGenerationView from "@/pages/UrlGenerationView";
import EngagementPlannerPage from "@/pages/EngagementPlannerPage";
import EngagementPlanView from "@/pages/EngagementPlanView";
import CaptionBioPage from "@/pages/CaptionBioPage";
import CaptionGenerationView from "@/pages/CaptionGenerationView";
import { Toaster } from "@/components/ui/sonner";

// Wrapper: redirect logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

// Layout wrapper: show Navbar only on non-auth pages
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/calendar-generator" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calendar/:id" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/url-generator" element={<ProtectedRoute><UrlGeneratorPage /></ProtectedRoute>} />
        <Route path="/url-generation/:id" element={<ProtectedRoute><UrlGenerationView /></ProtectedRoute>} />
        <Route path="/engagement-planner" element={<ProtectedRoute><EngagementPlannerPage /></ProtectedRoute>} />
        <Route path="/engagement-plan/:id" element={<ProtectedRoute><EngagementPlanView /></ProtectedRoute>} />
        <Route path="/caption-generator" element={<ProtectedRoute><CaptionBioPage /></ProtectedRoute>} />
        <Route path="/caption-generation/:id" element={<ProtectedRoute><CaptionGenerationView /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
        <Toaster position="top-center" />
      </div>
    </AuthProvider>
  );
}

export default App;