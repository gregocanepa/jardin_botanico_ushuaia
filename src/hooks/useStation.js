import { useMemo } from 'react'
import stations from '../data/stations.json'
import { useLang } from '../context/LanguageContext'

export const DEFAULT_LANG = 'es'

const TRANSLATED = ['name', 'shortDescription', 'description', 'facts', 'tags', 'audio']
const EMPTY = { facts: {}, tags: [] } // so the page can still map over them

const isMissing = (v) => v === undefined || v === null || v === ''

/**
 * Value of a translated field ({ es, en }) in `lang`, falling back to Spanish
 * when the translation is missing — a gap in stations.json must never crash a page.
 */
function translate(station, field, lang) {
  const value = station[field]
  if (isMissing(value)) return EMPTY[field]
  if (typeof value !== 'object' || Array.isArray(value)) return value // not translated
  if (!isMissing(value[lang])) return value[lang]
  if (import.meta.env.DEV) console.warn(`stations.json: "${station.slug}" has no ${field}.${lang}, using ${DEFAULT_LANG}`)
  return isMissing(value[DEFAULT_LANG]) ? EMPTY[field] : value[DEFAULT_LANG]
}

export function resolve(station, lang) {
  const resolved = { ...station }
  for (const field of TRANSLATED) resolved[field] = translate(station, field, lang)
  return resolved
}

/**
 * Returns the station matching the given slug, with all fields resolved
 * for the current language. Data comes from static JSON — works offline.
 * To migrate to a CMS, only this file needs to change.
 */
export function useStation(slug) {
  const { lang } = useLang()

  return useMemo(() => {
    if (!slug) return { station: null, loading: false, error: 'No slug' }
    const found = stations.find(s => s.slug === slug)
    if (!found) return { station: null, loading: false, error: `Station "${slug}" not found` }
    return { station: resolve(found, lang), loading: false, error: null }
  }, [slug, lang])
}

/**
 * Returns all stations sorted by their `order` field, resolved for the
 * current language.
 */
export function useAllStations() {
  const { lang } = useLang()

  return useMemo(() => {
    const sorted = [...stations]
      .sort((a, b) => a.order - b.order)
      .map(s => resolve(s, lang))
    return { stations: sorted }
  }, [lang])
}
