import { Box, Tooltip } from '@mui/material'

interface FlavorPodProps {
  colorHex: string
  name: string
  width?: number
  height?: number
  isEmpty?: boolean
}

function FlavorPodGraphic({ colorHex, name, width = 60, height = 80, isEmpty = false }: FlavorPodProps) {
  const actualColor = isEmpty ? '#555555' : colorHex
  const capColor = isEmpty ? '#333333' : '#222222'

  return (
    <Tooltip title={name}>
      <Box sx={{ width, height, display: 'inline-block', position: 'relative' }}>
        <svg viewBox="0 0 100 130" width="100%" height="100%">
          {/* Cap */}
          <rect x="20" y="10" width="60" height="30" fill={capColor} rx="10" />
          <rect x="30" y="40" width="40" height="15" fill="#444" />
          
          {/* Main Pod Body */}
          <path d="M 25 55 Q 10 90 15 120 L 85 120 Q 90 90 75 55 Z" fill={actualColor} />
          
          {/* Highlight effect */}
          <path d="M 35 55 Q 25 90 30 115 L 45 115 Q 40 90 50 55 Z" fill="rgba(255,255,255,0.2)" />
        </svg>
      </Box>
    </Tooltip>
  )
}

export default FlavorPodGraphic
