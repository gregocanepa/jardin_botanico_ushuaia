import { useNavigate } from 'react-router-dom'
import { useAllStations } from '../hooks/useStation'
import { useLang } from '../context/LanguageContext'
import { strings } from '../i18n/strings'
import LanguageToggle from '../components/LanguageToggle'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()
  const { stations } = useAllStations()
  const { lang } = useLang()
  const s = strings[lang]

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Jardín Botánico</h1>
          <LanguageToggle light />
        </div>
        <p className={styles.subtitle}>{s.subtitle} · {stations.length} {s.stations}</p>
      </header>

      {/* TODO: agregar mapa SVG o imagen del jardín aquí */}
      <div className={styles.mapPlaceholder}>
        <span>{s.mapPlaceholder}</span>
        <p>{s.comingSoon}</p>
      </div>

      <section className={styles.list}>
        <p className={styles.listLabel}>{s.stationsList}</p>
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
