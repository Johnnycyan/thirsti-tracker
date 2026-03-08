import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BFFF', // Cyan/Blue accent
      contrastText: '#fff',
    },
    secondary: {
      main: '#008B8B', // Darker cyan
      contrastText: '#fff',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
})

export default theme
