import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

// Unknown URL or station slug (e.g. an old or mistyped QR). Shown in both
// languages: the visitor may have landed here before choosing one.
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <p className={styles.icon} aria-hidden="true">🌿</p>
      <h1 className={styles.title}>Estación no encontrada</h1>
      <p className={styles.titleEn} lang="en">Station not found</p>
      <p className={styles.text}>Esta página no existe o el QR puede estar desactualizado.</p>
      <p className={styles.text} lang="en">This page doesn't exist or the QR code may be out of date.</p>
      <Link className={styles.primaryBtn} to="/">Ver todas las estaciones · See all stations</Link>
    </div>
  )
}
