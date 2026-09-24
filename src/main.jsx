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
// index.html paints the page dark until the app has drawn its first screen (no white flash on
// launch); after that each screen sets its own background, light mode included.
// (The timer is a backup: frames don't run while the page is hidden.)
const clearStartBackground = () => document.body.style.removeProperty('background')
requestAnimationFrame(() => requestAnimationFrame(clearStartBackground))
setTimeout(clearStartBackground, 1500)

// Keeps the app's files on the device so the home-screen app and repeat visits open fast
// (public/sw.js). Registered after the page has loaded so it never slows the first visit.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* not available: works as before */ })
  })
}
