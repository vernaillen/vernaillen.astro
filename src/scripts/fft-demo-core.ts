import { FFTVisualizer, type FFTVisualizerOptions } from '@fft-visualizer/core'
import type { FftProcessor } from '@fft-visualizer/core/wasm'

const BANDS = 80

const SOMA = {
  name: 'Groove Salad Classic',
  station: 'https://somafm.com/gsclassic/',
  support: 'https://somafm.com/support/',
  songs: 'https://somafm.com/songs/gsclassic.json',
}

type AudioSource = 'radio' | 'mic'

// Same-origin `/api/radio` only exists on the old Nitro deploy; this static
// site needs PUBLIC_RADIO_URL to point at an absolute proxy origin instead
// (SomaFM 403s the Range header every <audio> fetch sends, so the stream must
// go through a proxy that strips it — see the source project's radio.get.ts).
function resolveStreamUrl() {
  return import.meta.env.PUBLIC_RADIO_URL || '/api/radio'
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

const PRESETS: { name: string; props: Partial<FFTVisualizerOptions> }[] = [
  {
    name: 'Radial',
    props: {
      radial: true, radialInnerRadius: 0.35, barSpace: 0.2,
      reflexRatio: 0.65, reflexAlpha: 0.5, glow: 0.9,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      showPeaks: false, smoothing: 0.65,
    },
  },
  {
    name: 'Stereo',
    props: {
      stereo: true, barSpace: 0.4, reflexRatio: 0.35, reflexAlpha: 0.5, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      showPeaks: false, smoothing: 0.65,
    },
  },
  {
    name: 'Reflected',
    props: {
      gradient: 'aurora', glow: 0.5, barSpace: 0.3,
      reflexRatio: 0.3, reflexAlpha: 0.3, showPeaks: false, smoothing: 0.65,
    },
  },
  {
    name: 'LED meter',
    props: {
      ledBars: true, ledShape: 'meter', barSpace: 0.35,
      gradient: [
        { stop: 0, color: '#22dd66' },
        { stop: 0.6, color: '#ffd000' },
        { stop: 1, color: '#ff3344' },
      ],
    },
  },
  {
    name: 'Lumi bars',
    props: {
      lumiBars: true, bands: 40, barSpace: 0.05,
      reflexRatio: 0.35, reflexAlpha: 0.25, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      colorMode: 'bar-level', stereo: true,
      showPeaks: true, peakDecay: 0.99, smoothing: 0.65,
    },
  },
  {
    name: 'Lazers',
    props: {
      radial: true, radialInnerRadius: 0, barSpace: 0.35, glow: 1,
      gradient: 'rainbow', gradientDirection: 'horizontal',
      stereo: true, showPeaks: false, smoothing: 0.5, bands: 40,
    },
  },
]

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

const sourceLabel: Record<AudioSource, string> = { radio: 'Play radio', mic: 'Microphone' }

export function boot(shell: HTMLElement) {
  shell.innerHTML = `
    <canvas class="fft-demo-canvas"></canvas>
    <div class="fft-demo-controls">
      <button type="button" class="fft-demo-btn" data-source="radio">${sourceLabel.radio}</button>
      <button type="button" class="fft-demo-btn" data-source="mic">${sourceLabel.mic}</button>
      <select class="fft-demo-preset" aria-label="Visual style"></select>
    </div>
    <p class="fft-demo-status" role="status"></p>
    <p class="fft-demo-attribution">
      <a href="${SOMA.station}" target="_blank" rel="noopener noreferrer">${SOMA.name}</a> on
      <a href="https://somafm.com" target="_blank" rel="noopener noreferrer">SomaFM</a> ·
      <a href="${SOMA.support}" target="_blank" rel="noopener noreferrer">support them</a>
    </p>
  `

  const canvas = shell.querySelector<HTMLCanvasElement>('.fft-demo-canvas')!
  const status = shell.querySelector<HTMLParagraphElement>('.fft-demo-status')!
  const select = shell.querySelector<HTMLSelectElement>('.fft-demo-preset')!
  const buttons = [...shell.querySelectorAll<HTMLButtonElement>('[data-source]')]

  for (const preset of PRESETS) {
    const option = document.createElement('option')
    option.textContent = preset.name
    select.append(option)
  }

  if (!webglAvailable()) {
    status.textContent = 'Visualizer needs WebGL, which is not available in this browser.'
    shell.querySelector('.fft-demo-controls')?.remove()
    return
  }

  const visualizer = new FFTVisualizer(canvas, { mode: 'external', background: '#0a0a12', ...PRESETS[0]!.props })

  let source: AudioSource | null = null
  let pending: AudioSource | null = null
  let audio: DemoAudio | null = null
  let runId = 0
  let npTimer: ReturnType<typeof setInterval> | null = null

  function setButtons() {
    for (const button of buttons) {
      const id = button.dataset.source as AudioSource
      const active = source === id
      button.textContent = active ? 'Stop' : pending === id ? 'Connecting…' : sourceLabel[id]
      button.classList.toggle('is-active', active)
      button.disabled = pending !== null && !active
    }
  }

  function feed(mono: Uint8Array, left: Uint8Array, right: Uint8Array) {
    visualizer.feedData(mono, left, right)
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
    } catch {
      instance.stop()
      if (id !== runId) return
      audio = null
      pending = null
      status.textContent = next === 'mic'
        ? 'No microphone — permission denied, or no input device available.'
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
  select.addEventListener('change', () => visualizer.setOptions(PRESETS[select.selectedIndex]!.props))
  setButtons()
}
