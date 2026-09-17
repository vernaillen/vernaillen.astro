import { FFTVisualizer } from '@fft-visualizer/core'
import type { FftProcessor } from '@fft-visualizer/core/wasm'
import { PRESETS, SOMA, SOURCE_LABEL, presetOptions, type AudioSource } from '../lib/fft-demo'

const BANDS = 80


// SomaFM 403s the Range header every <audio> fetch sends, so the stream goes
// through the radio app's proxy (see the source project's radio.get.ts).
// PUBLIC_RADIO_URL overrides the proxy origin at build time.
function resolveStreamUrl() {
  return import.meta.env.PUBLIC_RADIO_URL || 'https://radio.vernaillen.dev/api/radio'
}

interface DemoAudio {
  start: (onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) => Promise<void>
  stop: () => void
}

function createDemoAudio(source: AudioSource, bins: number, fftSize = 2048): DemoAudio {
  let ctx: AudioContext | null = null
  let audioEl: HTMLAudioElement | null = null
  let stream: MediaStream | null = null
  let analyserL: AnalyserNode | null = null
  let analyserR: AnalyserNode | null = null
  let procL: FftProcessor | null = null
  let procR: FftProcessor | null = null
  let bufL: Float32Array<ArrayBuffer> | null = null
  let bufR: Float32Array<ArrayBuffer> | null = null
  let rafId: number | null = null

  function analyse(onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) {
    if (!analyserL || !procL || !bufL) return
    analyserL.getFloatTimeDomainData(bufL)
    const left = new Uint8Array(procL.process(bufL))

    let right = left
    let mono = left
    if (analyserR && procR && bufR) {
      analyserR.getFloatTimeDomainData(bufR)
      right = new Uint8Array(procR.process(bufR))
      mono = new Uint8Array(bins)
      for (let i = 0; i < bins; i++) mono[i] = (left[i]! + right[i]!) >> 1
    }

    onData(mono, left, right)
    rafId = requestAnimationFrame(() => analyse(onData))
  }

  function openRadioStream() {
    const streamUrl = resolveStreamUrl()
    audioEl = new Audio()
    audioEl.preload = 'auto'
    if (/^https?:\/\//.test(streamUrl)) audioEl.crossOrigin = 'anonymous'
    audioEl.src = streamUrl
  }

  async function openMic(own: AudioContext) {
    const input = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    if (ctx !== own) {
      input.getTracks().forEach((track) => track.stop())
      return
    }
    stream = input
  }

  // Everything the autoplay policy cares about happens synchronously, inside
  // the click that called start(): the WASM chunk is only awaited once the
  // audio graph is wired and play()/resume() are already in flight, so the
  // gesture never crosses an await before audio is granted.
  async function start(onData: (mono: Uint8Array, left: Uint8Array, right: Uint8Array) => void) {
    stop()
    const own = new AudioContext()
    ctx = own
    const resumed = own.resume()
    void resumed.catch(() => {})
    let playback: Promise<void> = Promise.resolve()

    analyserL = own.createAnalyser()
    analyserL.fftSize = fftSize

    if (source === 'radio') {
      openRadioStream()
      const srcNode = own.createMediaElementSource(audioEl!)
      srcNode.connect(own.destination)
      const splitter = own.createChannelSplitter(2)
      srcNode.connect(splitter)
      analyserR = own.createAnalyser()
      analyserR.fftSize = fftSize
      splitter.connect(analyserL, 0)
      splitter.connect(analyserR, 1)
      playback = audioEl!.play()
    } else {
      await openMic(own)
      if (ctx !== own) return
      own.createMediaStreamSource(stream!).connect(analyserL)
    }

    const [wasm] = await Promise.all([import('@fft-visualizer/core/wasm'), resumed, playback])
    await (wasm as { __tla?: Promise<void> }).__tla
    if (ctx !== own) return

    procL = new wasm.FftProcessor(fftSize, bins, 100, 18000, own.sampleRate)
    bufL = new Float32Array(fftSize)
    if (source === 'radio') {
      procR = new wasm.FftProcessor(fftSize, bins, 100, 18000, own.sampleRate)
      bufR = new Float32Array(fftSize)
    }

    analyse(onData)
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    procL?.free()
    procL = null
    procR?.free()
    procR = null
    if (audioEl) {
      audioEl.pause()
      audioEl.removeAttribute('src')
      audioEl.load()
      audioEl = null
    }
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    ctx?.close()
    ctx = null
    analyserL = null
    analyserR = null
    bufL = null
    bufR = null
  }

  return { start, stop }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

/**
 * Mounts the visualizer into a demo root: the poster + play overlay inside
 * `[data-fft-stage]` (or the root itself) are replaced by the canvas stage,
 * and the pre-rendered `[data-fft-controls]` panel is wired up in place.
 */
export function boot(root: HTMLElement, options: { autostart?: AudioSource } = {}) {
  root.dataset.fftBooted = ''
  const host = root.querySelector<HTMLElement>('[data-fft-stage]') ?? root
  const panel = root.querySelector<HTMLElement>('[data-fft-controls]')!
  host.querySelector('.fft-demo-overlay')?.remove()
  host.querySelector('.fft-demo-poster')?.remove()
  host.insertAdjacentHTML('afterbegin', '<div class="fft-demo-stage"><canvas class="fft-demo-canvas"></canvas></div>')

  const canvas = host.querySelector<HTMLCanvasElement>('.fft-demo-canvas')!
  const status = panel.querySelector<HTMLParagraphElement>('.fft-demo-status')!
  const preset = panel.querySelector<HTMLElement>('[data-fft-preset]')!
  const presetIndex = () => Number(preset.dataset.index)
  const buttons = [...panel.querySelectorAll<HTMLButtonElement>('[data-source]')]

  if (!webglAvailable()) {
    status.textContent = 'Visualizer needs WebGL, which is not available in this browser.'
    for (const button of buttons) button.disabled = true
    return
  }

  const stage = canvas.parentElement!
  const currentPreset = () =>
    presetOptions(presetIndex(), {
      dark: document.documentElement.classList.contains('dark'),
      background: getComputedStyle(stage).backgroundColor,
    })
  const visualizer = new FFTVisualizer(canvas, { mode: 'external', ...currentPreset() })

  let source: AudioSource | null = null
  let pending: AudioSource | null = null
  let audio: DemoAudio | null = null
  let runId = 0
  let npTimer: ReturnType<typeof setInterval> | null = null

  function setButtons() {
    for (const button of buttons) {
      const id = button.dataset.source as AudioSource
      const active = source === id
      button.textContent = active ? 'Stop' : pending === id ? 'Connecting…' : SOURCE_LABEL[id]
      button.classList.toggle('is-active', active)
      button.disabled = pending !== null && !active
    }
  }

  function feed(mono: Uint8Array, left: Uint8Array, right: Uint8Array) {
    // feedData() with a stereo pair fills only the left/right buffers while the
    // mono presets draw from the mono buffer, so feed what the active preset draws.
    if (PRESETS[presetIndex()]!.props.stereo) visualizer.feedData(mono, left, right)
    else visualizer.feedData(mono)
  }

  async function refreshNowPlaying() {
    const id = runId
    try {
      const res = await fetch(SOMA.songs, { cache: 'no-store' })
      const json = await res.json()
      const song = json?.songs?.[0]
      if (id !== runId || source !== 'radio') return
      status.textContent = song ? `♫ ${song.artist} — ${song.title}` : ''
    } catch {
      // leave the previous status; the stream itself still plays
    }
  }

  function startNowPlaying() {
    refreshNowPlaying()
    npTimer = setInterval(refreshNowPlaying, 20000)
  }

  function stopNowPlaying() {
    if (npTimer) clearInterval(npTimer)
    npTimer = null
  }

  function stopAudio() {
    runId++
    audio?.stop()
    audio = null
    source = null
    pending = null
    stopNowPlaying()
    status.textContent = ''
    setButtons()
  }

  async function toggle(next: AudioSource) {
    const wasActive = source === next
    stopAudio()
    if (wasActive) return

    const id = runId
    pending = next
    setButtons()
    const instance = createDemoAudio(next, BANDS)
    audio = instance
    try {
      await instance.start(feed)
    } catch (error) {
      instance.stop()
      if (id !== runId) return
      audio = null
      pending = null
      status.textContent = next === 'mic'
        ? 'No microphone — permission denied, or no input device available.'
        : (error as { name?: string } | null)?.name === 'NotAllowedError'
          ? 'Press “Play radio” to start the stream.'
          : 'Could not connect to the radio stream.'
      setButtons()
      return
    }
    if (id !== runId) {
      instance.stop()
      return
    }
    pending = null
    source = next
    setButtons()
    if (next === 'radio') startNowPlaying()
    else status.textContent = '♫ Live from your microphone — analysed in the page, never sent anywhere.'
  }

  for (const button of buttons) {
    button.addEventListener('click', () => void toggle(button.dataset.source as AudioSource))
  }
  const applyPreset = () => visualizer.setOptions(currentPreset())
  panel.addEventListener('fft:preset', applyPreset)
  // The theme toggle flips the html class; re-apply so the background follows.
  new MutationObserver(applyPreset).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  setButtons()
  // Autostart after a click on the poster: the click that loaded the module
  // is a sticky user activation, so audio is allowed in Chromium and Firefox.
  // Safari may still refuse play(), which toggle() turns into a hint.
  if (options.autostart) void toggle(options.autostart)
}
