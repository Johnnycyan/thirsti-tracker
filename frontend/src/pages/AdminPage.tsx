import { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Divider, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Select, MenuItem, InputLabel, FormControl } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { apiClient } from '../services/api'

export default function AdminPage() {
  const [inventory, setInventory] = useState<{ co2_tanks: any[], flavor_pods: any[] }>({ co2_tanks: [], flavor_pods: [] })
  const [submissionCode, setSubmissionCode] = useState<string>('')
  
  const [co2Quantity, setCo2Quantity] = useState('1')
  const [co2Cost, setCo2Cost] = useState('15')
  
  const [flavorOpen, setFlavorOpen] = useState(false)
  const [flavorQuantity, setFlavorQuantity] = useState('1')
  const [flavorCost, setFlavorCost] = useState('5')
  const [flavorName, setFlavorName] = useState('New Flavor')
  const [flavorColor, setFlavorColor] = useState('#ff0000')

  // Edit states
  const [editTankOpen, setEditTankOpen] = useState(false)
  const [editingTank, setEditingTank] = useState<any>(null)
  
  const [editFlavorOpen, setEditFlavorOpen] = useState(false)
  const [editingFlavor, setEditingFlavor] = useState<any>(null)

  const [activeBaseColor, setActiveBaseColor] = useState<string | null>(null)

  const colorPalettes: Record<string, string[]> = {
    '#ff0000': ['#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#ff0000', '#cc0000', '#990000'], // Red
    '#ff8c00': ['#ffe5cc', '#ffcc99', '#ffb266', '#ff9933', '#ff8c00', '#e67e00', '#cc7000'], // Orange
    '#ffd700': ['#fff5cc', '#ffeb99', '#ffe066', '#ffd633', '#ffd700', '#e6c200', '#ccac00'], // Yellow
    '#32cd32': ['#d6f5d6', '#adebad', '#85e085', '#5cd65c', '#32cd32', '#2db82d', '#28a428'], // Green
    '#00bfff': ['#cceeff', '#99ddff', '#66ccff', '#33bbff', '#00bfff', '#00ace6', '#0099cc'], // Blue
    '#ff00ff': ['#ffccff', '#ff99ff', '#ff66ff', '#ff33ff', '#ff00ff', '#e600e6', '#cc00cc'], // Magenta
    '#8a2be2': ['#e8d4f9', '#d1a9f3', '#ba7eed', '#a353e7', '#8a2be2', '#7c27cb', '#6e22b5'], // Purple
  }

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get<any>('/api/admin/inventory')
      setInventory(res)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCode = async () => {
    try {
      const res = await apiClient.get<any>('/api/admin/code')
      setSubmissionCode(res.code)
    } catch (err) { }
  }

  useEffect(() => {
    fetchInventory()
    fetchCode()
  }, [])

  const handleGenerateCode = async () => {
    try {
      const res = await apiClient.post<any>('/api/admin/code', {})
      setSubmissionCode(res.code)
    } catch (err) {
      alert('Failed to generate code')
    }
  }

  const handlePurchaseCO2 = async () => {
    try {
      await apiClient.post('/api/admin/co2/purchase', {
        quantity: parseInt(co2Quantity),
        cost: parseFloat(co2Cost)
      })
      fetchInventory()
    } catch (err) {
      alert('Failed to purchase CO2')
    }
  }

  const handleInstallCO2 = async () => {
    try {
      await apiClient.post('/api/admin/co2/install', {})
      fetchInventory()
    } catch (err) {
      alert('Failed to install CO2 (make sure you have an extra full one)')
    }
  }

  const handleDeleteCO2 = async (id: number) => {
    try {
      await apiClient.delete(`/api/admin/co2/${id}`)
      fetchInventory()
    } catch (err) {
      alert('Failed to delete tank')
    }
  }

  const saveEditedTank = async () => {
    if (!editingTank) return
    try {
      await apiClient.put(`/api/admin/co2/${editingTank.id}`, {
        status: editingTank.status,
        doses_used: parseInt(editingTank.doses_used)
      })
      setEditTankOpen(false)
      fetchInventory()
    } catch (err) {
      alert('Failed to edit tank')
    }
  }

  const handlePurchaseFlavor = async () => {
    try {
      await apiClient.post('/api/admin/flavor/purchase', {
        quantity: parseInt(flavorQuantity),
        cost: parseFloat(flavorCost),
        name: flavorName,
        color_hex: flavorColor
      })
      setFlavorOpen(false)
      fetchInventory()
    } catch (err) {
      alert('Failed to purchase Flavor Pod')
    }
  }

  const handleInstallFlavor = async (id: number) => {
    try {
      await apiClient.post(`/api/admin/flavor/install/${id}`, {})
      fetchInventory()
    } catch (err) {
      alert('Failed to install flavor pod')
    }
  }

  const handleDeleteFlavor = async (id: number) => {
    try {
      await apiClient.delete(`/api/admin/flavor/${id}`)
      fetchInventory()
    } catch (err) {
      alert('Failed to delete flavor')
    }
  }

  const saveEditedFlavor = async () => {
    if (!editingFlavor) return
    try {
      await apiClient.put(`/api/admin/flavor/${editingFlavor.id}`, {
        name: editingFlavor.name,
        color_hex: editingFlavor.color_hex,
        status: editingFlavor.status,
        doses_used: parseInt(editingFlavor.doses_used)
      })
      setEditFlavorOpen(false)
      fetchInventory()
    } catch (err) {
      alert('Failed to edit flavor')
    }
  }

  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#00BFFF', fontWeight: 'bold' }}>
        Admin Panel
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        
        {/* Left Col: Actions */}
        <Box sx={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Submission Code */}
          <Card sx={{ bgcolor: '#1E1E1E' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff' }}>Submission Code</Typography>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>This code is required on the public <code>/dispense</code> page.</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ flexGrow: 1, p: 1, bgcolor: '#000', textAlign: 'center', borderRadius: 1, color: '#00BFFF', fontWeight: 'bold' }}>
                  {submissionCode || '---'}
                </Typography>
                <Button variant="contained" sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }} onClick={handleGenerateCode}>Generate New</Button>
              </Box>
            </CardContent>
          </Card>

          {/* CO2 Actions */}
          <Card sx={{ bgcolor: '#1E1E1E' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>CO2 Tanks</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField label="Quantity" type="number" value={co2Quantity} onChange={e => setCo2Quantity(e.target.value)} size="small" />
                <TextField label="Total Cost ($)" type="number" value={co2Cost} onChange={e => setCo2Cost(e.target.value)} size="small" />
                <Button variant="contained" sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }} onClick={handlePurchaseCO2}>Add</Button>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333' }} />
              
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>Install an extra full tank. Moves current tank to empty stock.</Typography>
              <Button variant="outlined" color="primary" fullWidth onClick={handleInstallCO2}>Install Next CO2 Tank</Button>
            </CardContent>
          </Card>

          {/* Flavor Actions */}
          <Card sx={{ bgcolor: '#1E1E1E' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Flavor Pods</Typography>
              <Button variant="contained" sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }} onClick={() => setFlavorOpen(true)}>Add Flavor Pods</Button>
            </CardContent>
          </Card>
        </Box>

        {/* Right Col: Inventory Tables */}
        <Box sx={{ flex: 2, minWidth: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          <Card sx={{ bgcolor: '#1E1E1E' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Flavor Pod Inventory</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa' }}>ID</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Name</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Status</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Doses Used</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.flavor_pods.map(pod => (
                    <TableRow key={pod.id}>
                      <TableCell sx={{ color: '#fff' }}>{pod.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: pod.color_hex }} />
                          {pod.name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{pod.status}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{pod.doses_used}</TableCell>
                      <TableCell sx={{ color: '#fff', display: 'flex', gap: 1 }}>
                        {pod.status === 'extra' && (
                          <Button size="small" variant="text" onClick={() => handleInstallFlavor(pod.id)}>Install</Button>
                        )}
                        <IconButton size="small" color="primary" onClick={() => { setEditingFlavor({ ...pod }); setEditFlavorOpen(true) }}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteFlavor(pod.id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#1E1E1E' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>CO2 Tank Inventory</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#aaa' }}>ID</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Status</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Doses Used</TableCell>
                    <TableCell sx={{ color: '#aaa' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.co2_tanks.map(tank => (
                    <TableRow key={tank.id}>
                      <TableCell sx={{ color: '#fff' }}>{tank.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{tank.status}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{tank.doses_used}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        <IconButton size="small" color="primary" onClick={() => { setEditingTank({ ...tank }); setEditTankOpen(true) }}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteCO2(tank.id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </Box>
      </Box>

      {/* Flavor Purchase Dialog */}
      <Dialog open={flavorOpen} onClose={() => setFlavorOpen(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff' }}}>
        <DialogTitle>Add Flavor Pods</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Flavor Name" value={flavorName} onChange={e => setFlavorName(e.target.value)} InputLabelProps={{ sx: { bgcolor: '#1a1a1a', px: 1 } }} sx={{ mt: 1 }} />
          <TextField label="Color Hex (e.g. #ff0000)" value={flavorColor} onChange={e => setFlavorColor(e.target.value)} InputLabelProps={{ sx: { bgcolor: '#1a1a1a', px: 1 } }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {Object.keys(colorPalettes).map(baseColor => (
              <Box 
                key={baseColor} 
                onClick={() => { setFlavorColor(baseColor); setActiveBaseColor(baseColor); }}
                sx={{ 
                  width: 24, height: 24, borderRadius: '50%', bgcolor: baseColor, cursor: 'pointer',
                  border: flavorColor === baseColor || activeBaseColor === baseColor ? '2px solid white' : 'none'
                }} 
              />
            ))}
          </Box>
          {activeBaseColor && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, p: 1, bgcolor: '#222', borderRadius: 2 }}>
              {colorPalettes[activeBaseColor].map(shade => (
                 <Box 
                   key={shade} 
                   onClick={() => setFlavorColor(shade)}
                   sx={{ 
                     width: 20, height: 20, borderRadius: '50%', bgcolor: shade, cursor: 'pointer',
                     border: flavorColor === shade ? '2px solid white' : 'none'
                   }} 
                 />
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Quantity" type="number" value={flavorQuantity} onChange={e => setFlavorQuantity(e.target.value)} />
            <TextField label="Total Cost ($)" type="number" value={flavorCost} onChange={e => setFlavorCost(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlavorOpen(false)}>Cancel</Button>
          <Button onClick={handlePurchaseFlavor} variant="contained">Purchase</Button>
        </DialogActions>
      </Dialog>

      {/* Edit CO2 Dialog */}
      <Dialog open={editTankOpen} onClose={() => setEditTankOpen(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff' }}}>
        <DialogTitle>Edit CO2 Tank</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
          {editingTank && (
            <>
              <TextField label="Doses Used" type="number" value={editingTank.doses_used} onChange={e => setEditingTank({ ...editingTank, doses_used: e.target.value })} />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select value={editingTank.status} label="Status" onChange={e => setEditingTank({ ...editingTank, status: e.target.value })}>
                  <MenuItem value="extra_full">Extra Full</MenuItem>
                  <MenuItem value="extra_empty">Extra Empty</MenuItem>
                  <MenuItem value="installed">Installed</MenuItem>
                  <MenuItem value="consumed">Consumed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTankOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedTank} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Flavor Dialog */}
      <Dialog open={editFlavorOpen} onClose={() => setEditFlavorOpen(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff' }}}>
        <DialogTitle>Edit Flavor Pod</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
          {editingFlavor && (
            <>
              <TextField label="Flavor Name" value={editingFlavor.name} onChange={e => setEditingFlavor({ ...editingFlavor, name: e.target.value })} />
              <TextField label="Color Hex" value={editingFlavor.color_hex} onChange={e => setEditingFlavor({ ...editingFlavor, color_hex: e.target.value })} />
              <TextField label="Doses Used" type="number" value={editingFlavor.doses_used} onChange={e => setEditingFlavor({ ...editingFlavor, doses_used: e.target.value })} />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select value={editingFlavor.status} label="Status" onChange={e => setEditingFlavor({ ...editingFlavor, status: e.target.value })}>
                  <MenuItem value="extra">Extra</MenuItem>
                  <MenuItem value="installed">Installed</MenuItem>
                  <MenuItem value="consumed">Consumed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFlavorOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedFlavor} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}
