import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Layout from './layout/Layout'
import AppShell from './layout/AppShell'
import WorkspaceLayout from './layout/WorkspaceLayout'
import LandingPage from './pages/LandingPage'
import DocsPage from './pages/DocsPage'
import ResearchPage from './pages/ResearchPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import { AuthProvider } from './context/AuthContext'

const router = createBrowserRouter([
  // ── Marketing / Public pages (with NavBar + Footer) ──────────────────────
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'research', element: <ResearchPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ── Standalone auth page (no Layout, no footer) ──────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ── Authenticated app shell (no marketing footer) ─────────────────────────
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },

  // ── Canvas workspace (full screen, own layout) ────────────────────────────
  {
    path: '/workspace',
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: ':canvasId', element: <App /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
