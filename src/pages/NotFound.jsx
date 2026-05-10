import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70dvh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <p style={{ fontSize: 48 }}>🌿</p>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>Estación no encontrada</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Esta página no existe o el QR puede estar desactualizado.</p>
      <button
        onClick={() => navigate('/')}
        style={{ marginTop: '1rem', background: 'var(--color-primary)', color: '#FAEEDA', padding: '12px 24px', borderRadius: 'var(--radius-sm)', fontSize: 14 }}
      >
        Volver al recorrido
      </button>
    </div>
  )
}
