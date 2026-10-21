// Tiny synthesised TV sounds (no audio files). Everything is generated with
// the Web Audio API on demand, and nothing plays until the visitor turns
// sound on from the remote or the TV menu.

let ctx
let master
let noiseBuffer

function audio(volume) {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.connect(ctx.destination)
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  master.gain.value = (volume / 10) * 0.35
  return ctx
}

function envelope(node, t, attack, hold, release, peak = 1) {
  node.gain.setValueAtTime(0, t)
  node.gain.linearRampToValueAtTime(peak, t + attack)
  node.gain.setValueAtTime(peak, t + attack + hold)
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release)
}

function noise(c, t, duration, { freq = 3000, q = 0.7, peak = 0.8 } = {}) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = q
  const g = c.createGain()
  envelope(g, t, 0.005, duration, 0.08, peak)
  src.connect(filter).connect(g).connect(master)
  src.start(t)
  src.stop(t + duration + 0.2)
}

function tone(c, t, freq, duration, { type = 'square', peak = 0.25, slide } = {}) {
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + duration)
  const g = c.createGain()
  envelope(g, t, 0.003, duration * 0.6, duration * 0.4, peak)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export const sounds = {
  click(volume) {
    const c = audio(volume); if (!c) return
    noise(c, c.currentTime, 0.012, { freq: 1800, q: 2, peak: 0.6 })
  },
  static(volume, duration = 0.35) {
    const c = audio(volume); if (!c) return
    noise(c, c.currentTime, duration, { freq: 2500, q: 0.4, peak: 0.7 })
  },
  beep(volume) {
    const c = audio(volume); if (!c) return
    tone(c, c.currentTime, 1240, 0.07, { peak: 0.12 })
  },
  powerOn(volume) {
    const c = audio(volume); if (!c) return
    const t = c.currentTime
    tone(c, t, 55, 0.25, { type: 'sine', peak: 0.6, slide: 40 })
    noise(c, t + 0.05, 0.25, { freq: 4000, q: 0.5, peak: 0.25 })
    tone(c, t + 0.1, 15000, 0.6, { type: 'sine', peak: 0.02 })
  },
  powerOff(volume) {
    const c = audio(volume); if (!c) return
    const t = c.currentTime
    tone(c, t, 420, 0.3, { type: 'sine', peak: 0.2, slide: 60 })
    noise(c, t, 0.08, { freq: 900, q: 1, peak: 0.4 })
  },
  whir(volume, duration = 0.6) {
    const c = audio(volume); if (!c) return
    const t = c.currentTime
    tone(c, t, 180, duration, { type: 'sawtooth', peak: 0.05, slide: 260 })
    noise(c, t, duration, { freq: 6000, q: 1.5, peak: 0.12 })
  },
}
