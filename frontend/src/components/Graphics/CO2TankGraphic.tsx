import { Box, Tooltip } from '@mui/material'

interface CO2TankProps {
  status: 'full' | 'empty'
  width?: number
  height?: number
}

function CO2TankGraphic({ status, width = 60, height = 180 }: CO2TankProps) {
  const isFull = status === 'full'
  const primaryColor = isFull ? '#00BFFF' : '#555555'
  const secondaryColor = isFull ? '#008B8B' : '#333333'
  const labelColor = isFull ? '#ffffff' : '#888888'

  return (
    <Tooltip title={isFull ? 'Full CO2' : 'Empty CO2'}>
      <Box sx={{ width, height, display: 'inline-block', position: 'relative' }}>
        <svg viewBox="0 0 100 300" width="100%" height="100%">
          {/* Valve top */}
          <rect x="35" y="10" width="30" height="20" fill="#a0a0a0" rx="4" />
          <rect x="40" y="30" width="20" height="15" fill="#888888" />
          
          {/* Neck */}
          <path d="M40 45 L60 45 L80 80 L20 80 Z" fill={secondaryColor} />
          
          {/* Main Body */}
          <rect x="20" y="80" width="60" height="20" fill={primaryColor} />
          <rect x="20" y="80" width="60" height="200" fill={primaryColor} rx="15" />
          
          {/* Gradient overlay for 3D effect */}
          <rect x="20" y="80" width="30" height="20" fill="rgba(255,255,255,0.15)" />
          <rect x="20" y="80" width="30" height="200" fill="rgba(255,255,255,0.15)" rx="15" />
          
          {/* Label area */}
          <rect x="25" y="120" width="50" height="80" fill={secondaryColor} rx="5" />
          <text x="50" y="165" fontFamily="Arial" fontSize="24" fontWeight="bold" fill={labelColor} textAnchor="middle">
            CO2
          </text>
        </svg>
      </Box>
    </Tooltip>
  )
}

export default CO2TankGraphic
