import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const setBootText = (text: string) => {
  const el = document.getElementById("boot-indicator")
  if (!el) return
  el.textContent = text
}

window.addEventListener("error", (e) => {
  setBootText(`Erro no app: ${e.message}`)
})

window.addEventListener("unhandledrejection", () => {
  setBootText("Erro no app: promessa não tratada")
})

setBootText("Carregando…")

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

const bootIndicator = document.getElementById("boot-indicator")
if (bootIndicator) bootIndicator.remove()
