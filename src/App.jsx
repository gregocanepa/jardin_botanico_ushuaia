import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Station from './pages/Station.jsx'
import NotFound from './pages/NotFound.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'

export default function App() {
  return (
    <Routes>
      {/* Home screen: garden map and full station list */}
      <Route path="/" element={<Home />} />

      {/* Individual station page — accessed directly via QR code */}
      {/* Example: /estacion/orquideas */}
      <Route path="/estacion/:slug" element={<Station />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
