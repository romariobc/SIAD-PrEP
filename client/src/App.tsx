import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { PatientsPage } from './pages/PatientsPage'
import { AppointmentsPage } from './pages/AppointmentsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/pacientes" replace />} />
              <Route path="/pacientes" element={<PatientsPage />} />
              <Route path="/consultas" element={<AppointmentsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
