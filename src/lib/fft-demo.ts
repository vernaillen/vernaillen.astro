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
  ledBars: false, ledShape: 'segment', lumiBars: false, bands: 80, noiseFloor: 0,
}


export const PRESETS: { name: string; props: Partial<FFTVisualizerOptions>; light?: Partial<FFTVisualizerOptions> }[] = [
  {
    name: 'Reflected',
    props: {
      // The site's primary (vernaillen gold) palette: near-black gold for the
      // quietest bars up to a white peak, so the level spread reads at a glance.
      gradient: [
        { stop: 0, color: '#452e06' },
        { stop: 0.45, color: '#9c8e1b' },
        { stop: 0.8, color: '#e6e2b5' },
        { stop: 1, color: '#ffffff' },
      ],
      colorMode: 'bar-level',
      glow: 0.4, barSpace: 0.5,
      noiseFloor: 30,
      reflexRatio: 0.3, reflexAlpha: 0.35, showPeaks: false, smoothing: 0.65,
    },
    light: {
      // On the light background a white tip vanishes, so run the ramp the other
      // way: pale gold when quiet, down to near-black at the peak.
      gradient: [
        { stop: 0, color: '#d6d090' },
        { stop: 0.45, color: '#9c8e1b' },
        { stop: 0.8, color: '#5e4509' },
        { stop: 1, color: '#131210' },
      ],
    },
  },
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

// lucide chevron-left / chevron-right, inlined because the controls are a
// plain HTML string (no Astro components at this point in the pipeline).
const chevron = (d: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`

/**
 * The player controls, rendered at build time so they occupy their space
 * before the demo is booted (no layout shift when it loads). The core wires
 * them up on boot; before that, a source button click boots the demo.
 */
export function fftControlsHtml(): string {
  // Every preset name is rendered and the inactive ones only hidden, so the
  // name box is as wide as the longest and stepping never shifts the arrows.
  const names = PRESETS.map((preset, i) => `<span${i ? '' : ' data-current'}>${preset.name}</span>`).join('')
  return [
    '<div class="fft-demo-panel" data-fft-controls>',
    '<div class="fft-demo-controls flex flex-col gap-2">',
    '<div class="flex gap-2">',
    `<button type="button" class="fft-demo-btn flex-1" data-source="radio">${SOURCE_LABEL.radio}</button>`,
    `<button type="button" class="fft-demo-btn flex-1" data-source="mic">${SOURCE_LABEL.mic}</button>`,
    '</div>',
    '<div class="fft-demo-preset" role="group" aria-label="Visual style" data-fft-preset data-index="0">',
    `<button type="button" class="fft-demo-step" data-preset-step="-1" aria-label="Previous visual style">${chevron('m15 18-6-6 6-6')}</button>`,
    `<span class="fft-demo-preset-name" aria-live="polite">${names}</span>`,
    `<button type="button" class="fft-demo-step" data-preset-step="1" aria-label="Next visual style">${chevron('m9 18 6-6-6-6')}</button>`,
    '</div>',
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
