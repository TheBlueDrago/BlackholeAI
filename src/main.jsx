import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// Catches the browser's "install app" offer as soon as it's made (see Profile → Install app).
import '@/lib/installPrompt'

// Pages load on demand. After a new deploy, a tab opened earlier can ask for page files
// that no longer exist; reload once to pick up the new version instead of breaking.
window.addEventListener('vite:preloadError', (event) => {
  let last = 0
  try { last = Number(sessionStorage.getItem('bh-reloaded-at')) || 0 } catch { /* storage blocked */ }
  if (Date.now() - last < 10000) return
  try { sessionStorage.setItem('bh-reloaded-at', String(Date.now())) } catch { /* storage blocked */ }
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
