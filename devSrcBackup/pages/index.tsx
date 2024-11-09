// Theming
import defaultTheme from '../styles/theme/defaultTheme'
import { ThemeProvider, CssBaseline } from '@mui/material';

///import ReactAdmin from '../reactadmin'

import dynamic from 'next/dynamic'

// No server-side rendering for now
// Can re-enable when uses of window + document are fixed
const RouterNoSSR = dynamic(
  () => import('../App'),
  { ssr: false }
)

// const ReactAdmin = dynamic(
//   () => import('../reactadmin'),
//   { ssr: false }
// )

export default function Index() {
//  if (false) return <ReactAdmin></ReactAdmin>
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline/>
      <RouterNoSSR></RouterNoSSR>        
    </ThemeProvider>
    );
}
