import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Layout from './layout/Layout'
import WorkspaceLayout from './layout/WorkspaceLayout'
import LandingPage from './pages/LandingPage'
import DocsPage from './pages/DocsPage'
import ResearchPage from './pages/ResearchPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

const router = createBrowserRouter([
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
  {
    path: '/workspace',
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <App /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
