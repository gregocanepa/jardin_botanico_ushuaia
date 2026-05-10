import { useMemo } from 'react'
import stations from '../data/stations.json'
import { useLang } from '../context/LanguageContext'

function resolve(station, lang) {
  return {
    ...station,
    name:             station.name[lang],
    shortDescription: station.shortDescription[lang],
    description:      station.description[lang],
    facts:            station.facts[lang],
    tags:             station.tags[lang],
    audio:            station.audio[lang],
  }
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
