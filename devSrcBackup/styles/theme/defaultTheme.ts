import { createTheme } from '@mui/material/styles';

// Example of customized Material Theme
// -> use primary color of my.dashjoin.com
const customTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
        main: '#65558F'
    }
  }
});

export default customTheme;
