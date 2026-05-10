import { useState, useEffect } from 'react'
import stations from '../data/stations.json'

/**
 * Returns the station matching the given slug.
 * Data comes from static JSON — works offline with no network requests.
 * To migrate to a CMS, only this file needs to change.
 */
export function useStation(slug) {
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    const found = stations.find(s => s.slug === slug)
    if (found) {
      setStation(found)
    } else {
      setError(`Station "${slug}" not found`)
    }
    setLoading(false)
  }, [slug])

  return { station, loading, error }
}

/**
 * Returns all stations sorted by their `order` field.
 */
export function useAllStations() {
  const sorted = [...stations].sort((a, b) => a.order - b.order)
  return { stations: sorted }
}
