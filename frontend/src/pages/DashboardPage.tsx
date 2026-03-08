import { useEffect, useState, useMemo } from 'react'
import { Box, Typography, CircularProgress, Card, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiClient } from '../services/api'
import CO2TankGraphic from '../components/Graphics/CO2TankGraphic'
import FlavorPodGraphic from '../components/Graphics/FlavorPodGraphic'

function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, statsRes] = await Promise.all([
          apiClient.get<any>('/api/dashboard'),
          apiClient.get<any>('/api/analytics')
        ])
        setData(dashRes)
        setAnalyticsData(statsRes)
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const chartData = useMemo(() => {
    if (!analyticsData?.all_dispenses) return []
    const dailyDoses: Record<string, { date: string, co2: number, flavor: number }> = {}
    analyticsData.all_dispenses.forEach((log: any) => {
      const d = new Date(log.created_at).toLocaleDateString()
      if (!dailyDoses[d]) {
        dailyDoses[d] = { date: d, co2: 0, flavor: 0 }
      }
      dailyDoses[d].co2 += log.co2_doses
      dailyDoses[d].flavor += log.flavor_doses
    })
    return Object.values(dailyDoses)
  }, [analyticsData])

  const avgDosesPerDay = useMemo(() => {
    if (chartData.length === 0) return { co2: 0, flavor: 0 }
    const totalCo2 = chartData.reduce((sum, day) => sum + day.co2, 0)
    const totalFlavor = chartData.reduce((sum, day) => sum + day.flavor, 0)
    return {
      co2: Math.round((totalCo2 / chartData.length) * 10) / 10,
      flavor: Math.round((totalFlavor / chartData.length) * 10) / 10
    }
  }, [chartData])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
  }

  if (!data) {
    return <Typography color="error" sx={{ p: 4 }}>Failed to load dashboard data.</Typography>
  }

  const { current_co2, current_flavor, inventory, analytics } = data

  const co2Doses = current_co2?.doses_used || 0
  const flavorDoses = current_flavor?.doses_used || 0
  const flavorName = current_flavor?.name || 'None'
  const flavorColor = current_flavor?.color_hex || '#555555'

  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>

      {/* Top Section: Current Status */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mb: 6 }}>
        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, textAlign: 'center', p: 2, width: { xs: '100%', md: '45%' }, maxWidth: 500, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 240, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 2 }}>
            {current_co2 && current_co2.id ? (
              <CO2TankGraphic status="full" height={220} width={80} />
            ) : (
              <Typography color="gray">No Tank Installed</Typography>
            )}
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h5" sx={{ color: current_co2?.id ? '#00BFFF' : '#555555' }}>
              {current_co2?.id ? (current_co2.status === 'empty' ? 'Empty CO2' : 'Full CO2') : 'None'}
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>{co2Doses}</Typography>
            <Typography variant="subtitle1" color="gray">Doses Used</Typography>
            {analytics?.avg_co2_doses > 0 && current_co2?.id && (
              <Typography variant="body2" color="#00BFFF" sx={{ mt: 1, fontWeight: 'bold' }}>
                Est. Remaining: {Math.max(0, Math.round(analytics.avg_co2_doses - co2Doses))} doses
              </Typography>
            )}
          </Box>
          <Divider sx={{ my: 2, borderColor: '#333' }} />
          <Typography sx={{ mt: 2, color: '#aaa', mb: 1 }}>Extras in Stock: {(inventory?.co2_full?.length || 0) + (inventory?.co2_empty?.length || 0)}</Typography>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 1, justifyContent: 'center', height: 120, alignItems: 'flex-end' }}>
            {inventory?.co2_full?.map((tank: any, i: number) => (
              <Box key={`full-${i}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                <CO2TankGraphic status="full" height={80} width={30} />
                <Typography variant="caption" sx={{ mt: 1, whiteSpace: 'nowrap' }}>Full CO2</Typography>
              </Box>
            ))}
            {inventory?.co2_empty?.map((tank: any, i: number) => (
              <Box key={`empty-${i}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60, opacity: 0.5 }}>
                <CO2TankGraphic status="empty" height={80} width={30} />
                <Typography variant="caption" sx={{ mt: 1, whiteSpace: 'nowrap' }}>Empty CO2</Typography>
              </Box>
            ))}
          </Box>
        </Card>

        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, textAlign: 'center', p: 2, width: { xs: '100%', md: '45%' }, maxWidth: 500, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 240, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 2 }}>
            {current_flavor && current_flavor.id ? (
              <FlavorPodGraphic name={flavorName} colorHex={flavorColor} height={140} width={100} />
            ) : (
              <Typography color="gray">No Pod Installed</Typography>
            )}
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h5" sx={{ color: flavorColor }}>{flavorName}</Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>{flavorDoses}</Typography>
            <Typography variant="subtitle1" color="gray">Doses Used</Typography>
            {analytics?.avg_flavor_doses > 0 && current_flavor?.id && (
              <Typography variant="body2" color="#FF00FF" sx={{ mt: 1, fontWeight: 'bold' }}>
                Est. Remaining: {Math.max(0, Math.round(analytics.avg_flavor_doses - flavorDoses))} doses
              </Typography>
            )}
          </Box>
          <Divider sx={{ my: 2, borderColor: '#333' }} />
          <Typography sx={{ mt: 2, color: '#aaa', mb: 1 }}>Extras in Stock: {inventory?.flavor_extra?.length || 0}</Typography>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 1, justifyContent: 'center', height: 120, alignItems: 'flex-end' }}>
            {inventory?.flavor_extra?.map((pod: any) => (
              <Box key={pod.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                <FlavorPodGraphic name={pod.name} colorHex={pod.color_hex} height={60} width={40} />
                <Typography variant="caption" sx={{ mt: 1, whiteSpace: 'nowrap' }}>{pod.name}</Typography>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Divider sx={{ flexGrow: 1, borderColor: '#333', maxWidth: 200 }} />
        <Typography variant="h5" sx={{ 
          color: '#fff', 
          fontWeight: 900, 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          background: '-webkit-linear-gradient(45deg, #00BFFF, #FF00FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Analytics
        </Typography>
        <Divider sx={{ flexGrow: 1, borderColor: '#333', maxWidth: 200 }} />
      </Box>

      {/* High-Level Averages */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mb: 6 }}>
        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, p: 3, width: { xs: '100%', md: '30%' }, maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <Typography variant="h6" sx={{ color: '#00BFFF', mb: 3, fontWeight: 'bold', textShadow: '0 0 10px rgba(0,191,255,0.3)' }}>CO2 Averages</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>Avg Doses / Tank: <strong>{analytics?.avg_co2_doses || 0}</strong></Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>Avg Days / Tank: <strong>{analytics?.avg_co2_days || 0}</strong></Typography>
          <Typography variant="body1">Avg Doses / Day: <strong>{avgDosesPerDay.co2}</strong></Typography>
        </Card>

        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, p: 3, width: { xs: '100%', md: '30%' }, maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <Typography variant="h6" sx={{ color: '#FF00FF', mb: 3, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,0,255,0.3)' }}>Flavor Averages</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>Avg Doses / Pod: <strong>{analytics?.avg_flavor_doses || 0}</strong></Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>Avg Days / Pod: <strong>{analytics?.avg_flavor_days || 0}</strong></Typography>
          <Typography variant="body1">Avg Doses / Day: <strong>{avgDosesPerDay.flavor}</strong></Typography>
        </Card>
      </Box>

      {/* Usage Graph */}
      <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, p: 4, mb: 6, mx: 'auto', maxWidth: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <Typography variant="h6" sx={{ color: '#00BFFF', mb: 4, fontWeight: 'bold' }}>Daily Usage (Doses)</Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
              <Legend />
              <Line type="monotone" dataKey="co2" name="CO2 Doses" stroke="#00BFFF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="flavor" name="Flavor Doses" stroke="#FF00FF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Logs Tables */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
        
        {/* Dispense Log Table */}
        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, p: 3, flex: 1, minWidth: 300, maxWidth: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
           <Typography variant="h6" sx={{ color: '#00BFFF', mb: 2, fontWeight: 'bold' }}>Recent Dispenses</Typography>
           <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Date/Time</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Size</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Sparkle</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Flavor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData?.recent_dispenses?.map((log: any) => (
                  <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{log.size_oz}oz</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{log.sparkle_level}</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{log.flavor_level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </Box>
        </Card>

        {/* CO2 Installation History */}
        <Card sx={{ bgcolor: '#1E1E1E', color: '#fff', borderRadius: 4, p: 3, flex: 1, minWidth: 300, maxWidth: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
           <Typography variant="h6" sx={{ color: '#00BFFF', mb: 2, fontWeight: 'bold' }}>Tank Install History</Typography>
           <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Installed</TableCell>
                  <TableCell sx={{ color: '#aaa', fontWeight: 'bold' }}>Consumed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData?.co2_history?.filter((t: any) => t.installed_at).map((tank: any) => (
                  <TableRow key={tank.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{tank.id}</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{tank.status}</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{new Date(tank.installed_at).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{tank.consumed_at ? new Date(tank.consumed_at).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </Box>
        </Card>

      </Box>

    </Box>
  )
}

export default DashboardPage

