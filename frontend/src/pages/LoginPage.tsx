import { useState, useEffect } from 'react'
import { Card, CardContent, TextField, Button, Tabs, Tab, Box, Alert, Typography, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { login, register, checkHasUsers } from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const [tabIndex, setTabIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [hasUsers, setHasUsers] = useState<boolean | null>(null)

  useEffect(() => {
    checkHasUsers()
      .then(res => setHasUsers(res))
      .catch(() => setHasUsers(false))
  }, [])

  const handleLogin = async () => {
    try {
      setError(null)
      setLoading(true)
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setError(null)
      setLoading(true)
      await register(email, password)
      navigate('/admin')
    } catch (err) {
      setError('Registration failed. It may be disabled or the email is taken.')
    } finally {
      setLoading(false)
    }
  }

  if (hasUsers === null) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        {hasUsers ? (
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">Admin Login</Typography>
          </Box>
        ) : (
          <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)} variant="fullWidth">
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
        )}
        
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: hasUsers ? 0 : 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <TextField 
            label="Email" 
            variant="outlined" 
            fullWidth 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField 
            label="Password" 
            type="password"
            variant="outlined" 
            fullWidth 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!hasUsers && tabIndex === 1 && (
            <TextField 
              label="Confirm Password" 
              type="password"
              variant="outlined" 
              fullWidth 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={loading}
            onClick={hasUsers || tabIndex === 0 ? handleLogin : handleRegister}
            sx={{ mt: 1, py: 1.5 }}
          >
            {hasUsers || tabIndex === 0 ? 'Login' : 'Register'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage

