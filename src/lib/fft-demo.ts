// Shared by the client-side demo core and the build-time page/markdown
// renderers: presets and the static controls markup. No DOM access here.
import type { FFTVisualizerOptions } from '@fft-visualizer/core'

export type AudioSource = 'radio' | 'mic'

export const SOMA = {
  name: 'Groove Salad Classic',
  station: 'https://somafm.com/gsclassic/',
  support: 'https://somafm.com/support/',
  songs: 'https://somafm.com/songs/gsclassic.json',
}

export const SOURCE_LABEL: Record<AudioSource, string> = { radio: 'Play radio', mic: 'Microphone' }

// setOptions() patches on top of the current options, so every option a
// preset may set is reset to the library default first (values from the
// FFTVisualizerOptions docs) — otherwise presets leak into each other.
export const PRESET_BASE: Partial<FFTVisualizerOptions> = {
  radial: false, radialInnerRadius: 0.35, barSpace: 0.25,
  reflexRatio: 0, reflexAlpha: 0.25, glow: 0,
  gradient: 'classic', gradientDirection: 'vertical', colorMode: 'gradient',
  showPeaks: true, peakDecay: 0.997, smoothing: 0, stereo: false,
  ledBars: false, ledShape: 'segment', lumiBars: false, bands: 80,
}


export const PRESETS: { name: string; props: Partial<FFTVisualizerOptions>; light?: Partial<FFTVisualizerOptions> }[] = [
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
      // The site's primary (vernaillen gold) palette, dark at the base.
      gradient: [
        { stop: 0, color: '#755d0f' },
        { stop: 0.55, color: '#9c8e1b' },
        { stop: 1, color: '#e6e2b5' },
      ],
      glow: 0.5, barSpace: 0.3,
      reflexRatio: 0.3, reflexAlpha: 0.3, showPeaks: false, smoothing: 0.65,
    },
    light: {
      // On white the pale tip vanishes, so run the palette the other way.
      gradient: [
        { stop: 0, color: '#baaf4e' },
        { stop: 0.55, color: '#9c8e1b' },
        { stop: 1, color: '#5e4509' },
      ],
    },
  },
  {
    name: 'LED meter',
    props: {
      ledBars: true, ledShape: 'segment', barSpace: 0.35,
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

// The options for one preset in the current theme. `background` is the stage's
// computed colour so the canvas matches the page background in light mode.
export function presetOptions(index: number, theme: { dark: boolean; background: string }): Partial<FFTVisualizerOptions> {
  const preset = PRESETS[index]!
  return { ...PRESET_BASE, background: theme.background, ...preset.props, ...(theme.dark ? undefined : preset.light) }
}

/**
 * The player controls, rendered at build time so they occupy their space
 * before the demo is booted (no layout shift when it loads). The core wires
 * them up on boot; before that, a source button click boots the demo.
 */
export function fftControlsHtml(): string {
  const options = PRESETS.map((preset) => `<option>${preset.name}</option>`).join('')
  return [
    '<div class="fft-demo-panel" data-fft-controls>',
    '<div class="fft-demo-controls">',
    `<button type="button" class="fft-demo-btn" data-source="radio">${SOURCE_LABEL.radio}</button>`,
    `<button type="button" class="fft-demo-btn" data-source="mic">${SOURCE_LABEL.mic}</button>`,
    `<select class="fft-demo-preset" aria-label="Visual style">${options}</select>`,
    '</div>',
    '<p class="fft-demo-status" role="status"></p>',
    '<p class="fft-demo-attribution">',
    `<a href="${SOMA.station}" target="_blank" rel="noopener noreferrer">${SOMA.name}</a> on `,
    '<a href="https://somafm.com" target="_blank" rel="noopener noreferrer">SomaFM</a> · ',
    `<a href="${SOMA.support}" target="_blank" rel="noopener noreferrer">support them</a>`,
    '</p>',
    '</div>',
  ].join('')
}
