// jsdom doesn't implement media playback, so play()/pause()/paused are stubbed
// and the tests fire the <audio> events a real browser would.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AudioPlayer from './AudioPlayer.jsx'

let paused
let playImpl

beforeEach(() => {
  paused = true
  playImpl = () => Promise.resolve()
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    return playImpl.call(this)
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
    paused = true
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderPlayer(props = {}) {
  const utils = render(
    <AudioPlayer src="/audio/a.mp4" duration="2:00" label="Narración" errorText="No se pudo reproducir el audio." {...props} />,
  )
  const audio = utils.container.querySelector('audio')
  return { ...utils, audio }
}

const playButton = () => screen.getByRole('button', { name: 'Reproducir audio' })
const pauseButton = () => screen.getByRole('button', { name: 'Pausar audio' })

describe('AudioPlayer', () => {
  it('does not show "pause" until playback actually starts', async () => {
    let start
    playImpl = () => new Promise((resolve) => { start = resolve })
    const { audio } = renderPlayer()

    fireEvent.click(playButton())
    expect(playButton()).toBeInTheDocument() // still loading: no pause icon yet

    await act(async () => {
      paused = false
      start()
      audio.dispatchEvent(new Event('playing'))
    })
    expect(pauseButton()).toBeInTheDocument()
  })

  it('stays on "play" and shows an error when play() is rejected', async () => {
    playImpl = () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
    renderPlayer()

    await act(async () => { fireEvent.click(playButton()) })

    expect(playButton()).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo reproducir el audio.')
  })

  it('ignores AbortError (paused or src changed before playback started)', async () => {
    playImpl = () => Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    renderPlayer()

    await act(async () => { fireEvent.click(playButton()) })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error and resets to "play" when the audio element fails', async () => {
    const { audio } = renderPlayer()
    await act(async () => {
      paused = false
      audio.dispatchEvent(new Event('playing'))
    })
    expect(pauseButton()).toBeInTheDocument()

    act(() => { audio.dispatchEvent(new Event('error')) })

    expect(playButton()).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('pauses when playing and the button follows the pause event', async () => {
    const { audio } = renderPlayer()
    await act(async () => {
      paused = false
      audio.dispatchEvent(new Event('playing'))
    })

    fireEvent.click(pauseButton())

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    expect(playButton()).toBeInTheDocument()
  })

  it('resets playing state, progress and time when src changes', async () => {
    const { audio, rerender } = renderPlayer()
    vi.spyOn(audio, 'duration', 'get').mockReturnValue(100)
    vi.spyOn(audio, 'currentTime', 'get').mockReturnValue(65)
    await act(async () => {
      paused = false
      audio.dispatchEvent(new Event('playing'))
      audio.dispatchEvent(new Event('timeupdate'))
    })
    expect(pauseButton()).toBeInTheDocument()
    expect(screen.getByText('1:05')).toBeInTheDocument()

    rerender(<AudioPlayer src="/audio/b.mp4" duration="3:00" label="Narration" errorText="x" />)

    expect(playButton()).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('clears the error when src changes', () => {
    const { audio, rerender } = renderPlayer()
    act(() => { audio.dispatchEvent(new Event('error')) })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<AudioPlayer src="/audio/b.mp4" duration="3:00" label="Narration" errorText="x" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears a previous error when retrying', async () => {
    playImpl = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotSupportedError' }))
    renderPlayer()
    await act(async () => { fireEvent.click(playButton()) })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    playImpl = () => new Promise(() => {}) // pending
    fireEvent.click(playButton())

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('duration', () => {
    function loadMetadata(audio, seconds) {
      vi.spyOn(audio, 'duration', 'get').mockReturnValue(seconds)
      act(() => { audio.dispatchEvent(new Event('loadedmetadata')) })
    }

    it('shows the duration from the JSON until the metadata loads', () => {
      renderPlayer({ duration: '2:34' })
      expect(screen.getByText('2:34')).toBeInTheDocument()
    })

    it('replaces the JSON duration with the real one on loadedmetadata', () => {
      const { audio } = renderPlayer({ duration: '2:34' })

      loadMetadata(audio, 9.11)

      expect(screen.getByText('0:09')).toBeInTheDocument()
      expect(screen.queryByText('2:34')).not.toBeInTheDocument()
    })

    it('follows durationchange (e.g. Infinity first, real length later)', () => {
      const { audio } = renderPlayer({ duration: '2:34' })
      loadMetadata(audio, Infinity)
      expect(screen.getByText('2:34')).toBeInTheDocument() // unknown yet: keep fallback

      vi.spyOn(audio, 'duration', 'get').mockReturnValue(73)
      act(() => { audio.dispatchEvent(new Event('durationchange')) })

      expect(screen.getByText('1:13')).toBeInTheDocument()
    })

    it('ignores NaN/0 durations and keeps the fallback', () => {
      const { audio } = renderPlayer({ duration: '2:34' })
      loadMetadata(audio, NaN)
      loadMetadata(audio, 0)
      expect(screen.getByText('2:34')).toBeInTheDocument()
    })

    it('goes back to the new fallback when src changes', () => {
      const { audio, rerender } = renderPlayer({ duration: '2:34' })
      loadMetadata(audio, 9.11)
      vi.spyOn(audio, 'duration', 'get').mockReturnValue(NaN) // new src: length unknown

      rerender(<AudioPlayer src="/audio/b.mp4" duration="2:10" label="Narration" />)

      expect(screen.getByText('2:10')).toBeInTheDocument()
      expect(screen.queryByText('0:09')).not.toBeInTheDocument()
    })

    it('loads only the metadata up front, not the whole file', () => {
      const { audio } = renderPlayer()
      expect(audio).toHaveAttribute('preload', 'metadata')
    })
  })
})
