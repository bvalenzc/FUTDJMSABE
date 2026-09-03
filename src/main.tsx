import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { CartaDefs } from './components/Carta/CartaDefs'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartaDefs />
    <App />
  </StrictMode>,
)
