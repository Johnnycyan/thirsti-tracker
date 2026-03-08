import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme/theme'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import SubmissionPage from './pages/SubmissionPage'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dispense" element={<SubmissionPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
