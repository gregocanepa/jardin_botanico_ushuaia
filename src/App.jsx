import { Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Home from './pages/Home.jsx'
import Station from './pages/Station.jsx'
import NotFound from './pages/NotFound.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary>
      <LanguageProvider>
        {/* If the download overlay breaks, the tour still works (online) */}
        <ErrorBoundary fallback={null}>
          <OfflineBanner />
        </ErrorBoundary>
        {/* A broken page doesn't take the rest down; going to another URL clears the error */}
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/estacion/:slug" element={<Station />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
