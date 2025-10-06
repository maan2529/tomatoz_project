import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './router/AppRouter.tsx'
import GlobalLoader from './component/GlobalLoader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalLoader />
    <AppRouter />
  </StrictMode>,
)
