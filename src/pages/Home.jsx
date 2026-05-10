import { useNavigate } from 'react-router-dom'
import { useAllStations } from '../hooks/useStation'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()
  const { stations } = useAllStations()

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <h1 className={styles.title}>Jardín Botánico</h1>
        <p className={styles.subtitle}>Recorrido autoguiado · {stations.length} estaciones</p>
      </header>

      {/* TODO: agregar mapa SVG o imagen del jardín aquí */}
      <div className={styles.mapPlaceholder}>
        <span>Mapa del jardín</span>
        <p>Próximamente</p>
      </div>

      <section className={styles.list}>
        <p className={styles.listLabel}>Estaciones del recorrido</p>
        {stations.map(station => (
          <button
            key={station.id}
            className={styles.stationItem}
            onClick={() => navigate(`/estacion/${station.slug}`)}
          >
            <div className={styles.stationNum}>{station.order}</div>
            <div className={styles.stationInfo}>
              <p className={styles.stationName}>{station.name}</p>
              <p className={styles.stationSci}>{station.scientificName}</p>
              <p className={styles.stationDesc}>{station.shortDescription}</p>
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}
      </section>

    </div>
  )
}
