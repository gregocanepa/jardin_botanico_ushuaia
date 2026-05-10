import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Home from './pages/Home.jsx'
import Station from './pages/Station.jsx'
import NotFound from './pages/NotFound.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estacion/:slug" element={<Station />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LanguageProvider>
  )
}
