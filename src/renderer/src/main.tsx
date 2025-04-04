import './i18n/i18n'
import './styles/global.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Router } from './router'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
