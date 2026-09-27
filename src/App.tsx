import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Patients } from './pages/Patients'
import { Agenda } from './pages/Agenda'
import { PatientDetail } from './pages/PatientDetail'
import { PatientEditor } from './pages/PatientEditor'
import { VisitEditor } from './pages/VisitEditor'
import { VisitView } from './pages/VisitView'
import { PrintView } from './pages/PrintView'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Patients />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Agenda />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PatientEditor />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PatientDetail />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PatientEditor />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/visits/new"
            element={
              <ProtectedRoute>
                <AppShell>
                  <VisitEditor />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/visits/:visitId/edit"
            element={
              <ProtectedRoute>
                <AppShell>
                  <VisitEditor />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/visits/:visitId"
            element={
              <ProtectedRoute>
                <AppShell>
                  <VisitView />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/visits/:visitId/print"
            element={
              <ProtectedRoute>
                <PrintView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
