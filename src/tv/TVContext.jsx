import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { sounds } from './sound'

// The site behaves like a box TV with a VCR: each section is a channel, the
// picture has adjustable settings, and a remote drives channels, volume and
// tape transport (rewind, play, pause, fast-forward). This provider owns that
// state; the CRT overlay, on-screen display, remote and menu read from it.

export const CHANNELS = [
  { id: 'home', label: 'HOME' },
  { id: 'work', label: 'WORK' },
  { id: 'lab', label: 'LAB' },
  { id: 'about', label: 'ABOUT' },
  { id: 'contact', label: 'CONTACT' },
]

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const DEFAULTS = {
  effects: true,
  scanlines: true,
  noise: !reduced,
  flicker: !reduced,
  rgb: true,
  curve: true,
  brightness: 5,
  contrast: 5,
  color: 5,
  tint: 0,
  sound: false,
  volume: 6,
}

const KEY = 'tv-settings'
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEFAULTS }
}

const TV = createContext(null)
export const useTV = () => useContext(TV)

export const pad = (n) => String(n).padStart(2, '0')
const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
const modalOpen = () => !!document.querySelector('[aria-modal="true"]')

function sectionTop(id) {
  if (id === 'home') return 0
  const el = document.getElementById(id)
  return el ? el.getBoundingClientRect().top + window.scrollY - 8 : 0
}

export function TVProvider({ children }) {
  const [power, setPower] = useState('on')
  const [channel, setChannel] = useState(0)
  const [settings, setSettings] = useState(loadSettings)
  const [vcr, setVcrState] = useState('play')
  const [burst, setBurst] = useState(null)
  const [osd, setOsd] = useState({ channelAt: 0, vcrAt: 0, msg: null, msgAt: 0 })
  const [display, setDisplay] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [remoteOpen, setRemoteOpen] = useState(false)
  const tuning = useRef(0)
  const live = useRef({})

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* storage unavailable */ }
  }, [settings])

  const play = useCallback((name, ...args) => {
    if (settings.sound && settings.volume > 0) sounds[name]?.(settings.volume, ...args)
  }, [settings.sound, settings.volume])

  const flash = useCallback((msg) => setOsd((o) => ({ ...o, msg, msgAt: Date.now() })), [])
  const showChannel = useCallback(() => setOsd((o) => ({ ...o, channelAt: Date.now() })), [])

  const staticBurst = useCallback((ms = 320) => {
    setBurst({ id: Date.now(), ms })
    play('static', ms / 1000)
  }, [play])

  const tune = useCallback((target) => {
    const i = typeof target === 'number' ? target : CHANNELS.findIndex((c) => c.id === target)
    if (i < 0) return
    play('click')
    if (i >= CHANNELS.length) {
      staticBurst(700)
      flash(`CH ${pad(i + 1)}  NO SIGNAL`)
      return
    }
    staticBurst(300)
    tuning.current = Date.now()
    setTimeout(() => {
      window.scrollTo({ top: sectionTop(CHANNELS[i].id), behavior: 'instant' })
      setChannel(i)
      showChannel()
    }, 90)
  }, [play, staticBurst, flash, showChannel])

  const step = useCallback((d) => tune((live.current.channel + d + CHANNELS.length) % CHANNELS.length), [tune])

  const setVcr = useCallback((mode) => {
    play(mode === 'ff' || mode === 'rew' ? 'whir' : 'click')
    setVcrState((cur) => (mode === 'pause' && cur === 'pause' ? 'play' : mode === 'stop' ? 'stop' : mode))
    setOsd((o) => ({ ...o, vcrAt: Date.now() }))
  }, [play])

  const setSetting = useCallback((key, value) => setSettings((s) => ({ ...s, [key]: value })), [])
  const resetSettings = useCallback(() => setSettings({ ...DEFAULTS }), [])

  const changeVolume = useCallback((d) => {
    setSettings((s) => {
      const volume = Math.max(0, Math.min(10, s.volume + d))
      return { ...s, volume, sound: volume > 0 ? true : s.sound }
    })
    setOsd((o) => ({ ...o, msg: 'VOLUME', msgAt: Date.now() }))
  }, [])

  const toggleMute = useCallback(() => {
    setSettings((s) => ({ ...s, sound: !s.sound }))
    setOsd((o) => ({ ...o, msg: 'VOLUME', msgAt: Date.now() }))
  }, [])

  const powerOff = useCallback(() => { play('powerOff'); setVcrState('play'); setMenuOpen(false); setPower('off') }, [play])
  const powerOn = useCallback(() => { play('powerOn'); setPower('on'); setTimeout(() => { staticBurst(380); showChannel() }, 450) }, [play, staticBurst, showChannel])
  const togglePower = useCallback(() => (live.current.power === 'on' ? powerOff() : powerOn()), [powerOff, powerOn])

  live.current = { channel, power, vcr }

  // Channel follows normal scrolling too (without static).
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || Date.now() - tuning.current < 600) return
        const i = CHANNELS.findIndex((c) => c.id === e.target.id)
        if (i >= 0 && i !== live.current.channel) { setChannel(i); showChannel() }
      })
    }, { rootMargin: '-45% 0px -50% 0px' })
    const t = setTimeout(() => CHANNELS.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el) }), 500)
    return () => { clearTimeout(t); io.disconnect() }
  }, [showChannel])

  // In-page links to a section tune the channel instead of scrolling there.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return
      const i = CHANNELS.findIndex((c) => `#${c.id}` === a.getAttribute('href'))
      if (i < 0) return
      e.preventDefault()
      tune(i)
    }
    const onTune = (e) => tune(e.detail)
    const onStatic = (e) => staticBurst(e.detail || 280)
    const onOsd = (e) => flash(e.detail)
    document.addEventListener('click', onClick)
    window.addEventListener('tv-tune', onTune)
    window.addEventListener('tv-static', onStatic)
    window.addEventListener('tv-osd', onOsd)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('tv-tune', onTune)
      window.removeEventListener('tv-static', onStatic)
      window.removeEventListener('tv-osd', onOsd)
    }
  }, [tune, staticBurst, flash])

  // Remote shortcuts on the keyboard.
  useEffect(() => {
    const onKey = (e) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey || live.current.power !== 'on') return
      const k = e.key.toLowerCase()
      if (k === 'm') { e.preventDefault(); setMenuOpen((v) => !v); return }
      if (modalOpen()) return
      if (/^[0-9]$/.test(k)) tune(k === '0' ? 9 : Number(k) - 1)
      else if (k === ']') step(1)
      else if (k === '[') step(-1)
      else if (k === 'j') setVcr('rew')
      else if (k === 'k') setVcr(live.current.vcr === 'play' ? 'pause' : 'play')
      else if (k === 'l') setVcr('ff')
      else if (k === '=' || k === '+') changeVolume(1)
      else if (k === '-') changeVolume(-1)
      else if (k === 'i') setDisplay((v) => !v)
      else if (k === 'escape' && live.current.vcr !== 'play') setVcr('play')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tune, step, setVcr, changeVolume])

  // Tape transport: fast-forward and rewind scroll the page, pause freezes it.
  useEffect(() => {
    const html = document.documentElement
    if (vcr === 'stop') {
      const t = setTimeout(() => setVcrState('play'), 900)
      return () => clearTimeout(t)
    }
    if (vcr === 'pause') {
      html.classList.add('tv-paused')
      const y = window.scrollY
      const hold = () => window.scrollTo({ top: y, behavior: 'instant' })
      window.addEventListener('scroll', hold)
      return () => { html.classList.remove('tv-paused'); window.removeEventListener('scroll', hold) }
    }
    if (vcr !== 'ff' && vcr !== 'rew') return undefined
    const dir = vcr === 'ff' ? 1 : -1
    let raf
    let speed = 400
    let last = performance.now()
    const stop = () => { setVcrState('play'); setOsd((o) => ({ ...o, vcrAt: Date.now() })) }
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      speed = Math.min(speed + 3200 * dt, 2600)
      const max = html.scrollHeight - window.innerHeight
      const next = Math.max(0, Math.min(max, window.scrollY + dir * speed * dt))
      window.scrollTo({ top: next, behavior: 'instant' })
      if ((dir > 0 && next >= max - 1) || (dir < 0 && next <= 0)) { stop(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const cancel = () => stop()
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
    }
  }, [vcr])

  // Expose picture settings to CSS.
  useEffect(() => {
    const d = document.documentElement.dataset
    const on = settings.effects && power === 'on'
    d.tv = on ? 'on' : 'off'
    d.tvRgb = on && settings.rgb ? 'on' : 'off'
  }, [settings.effects, settings.rgb, power])

  const value = useMemo(() => ({
    power, powerOn, powerOff, togglePower,
    channel, tune, step,
    settings, setSetting, resetSettings,
    vcr, setVcr,
    burst, staticBurst,
    osd, flash, display, setDisplay,
    changeVolume, toggleMute,
    menuOpen, setMenuOpen, remoteOpen, setRemoteOpen,
    play,
  }), [power, powerOn, powerOff, togglePower, channel, tune, step, settings, setSetting, resetSettings, vcr, setVcr, burst, staticBurst, osd, flash, display, changeVolume, toggleMute, menuOpen, remoteOpen, play])

  return <TV.Provider value={value}>{children}</TV.Provider>
}
