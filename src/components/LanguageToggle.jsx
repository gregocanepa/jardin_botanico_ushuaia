import { useLang } from '../context/LanguageContext'
import styles from './LanguageToggle.module.css'

export default function LanguageToggle({ light = false }) {
  const { lang, toggle } = useLang()
  return (
    <button
      className={`${styles.toggle} ${light ? styles.light : ''}`}
      onClick={toggle}
      aria-label="Change language"
    >
      <span className={lang === 'es' ? styles.active : ''}>ES</span>
      <span className={styles.sep}>/</span>
      <span className={lang === 'en' ? styles.active : ''}>EN</span>
    </button>
  )
}
