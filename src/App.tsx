/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { RequireAuth } from '@/components/RequireAuth'

// Authenticated layout
import Layout from './components/Layout'

// Landing Page & Authenticated pages
import LandingPage from './pages/LandingPage'
import Index from './pages/Index'
import Catalog from './pages/Catalog'
import CatalogDetail from './pages/CatalogDetail'
import Compare from './pages/Compare'
import Recommendations from './pages/Recommendations'
import Diet from './pages/Diet'
import Profile from './pages/Profile'
import AssistantChat from './pages/AssistantChat'
import WeeklyReport from './pages/WeeklyReport'
import Achievements from './pages/Achievements'
import CatalogAdmin from './pages/CatalogAdmin'

// Public auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import ConfirmEmailChange from './pages/ConfirmEmailChange'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />

          {/* Routes sharing Layout (some public, some protected) */}
          <Route element={<Layout />}>
            {/* Public catalog routes */}
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<CatalogDetail />} />
            <Route path="/compare" element={<Compare />} />

            {/* Protected routes wrapped by RequireAuth */}
            <Route element={<RequireAuth />}>
              <Route path="/app" element={<Index />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/assistant" element={<AssistantChat />} />
              <Route path="/diet" element={<Diet />} />
              <Route path="/report" element={<WeeklyReport />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<CatalogAdmin />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
