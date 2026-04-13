// Web Audio API — procedural SFX (no external files)
// All functions are no-ops on SSR / unsupported browsers.

type OscType = OscillatorType

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const W = window as Window & { _sfxCtx?: AudioContext }
  if (!W._sfxCtx) {
    try {
      W._sfxCtx = new AudioContext()
    } catch {
      return null
    }
  }
  return W._sfxCtx
}

// Call once on first user gesture to satisfy browser autoplay policy.
export function sfxWarmup() { ctx() }

// endFrequency: if provided, sweeps frequency from `frequency` → `endFrequency` over `duration`.
function tone(
  frequency: number,
  duration: number,
  gain: number,
  type: OscType = 'sine',
  startDelay = 0,
  endFrequency?: number,
) {
  const c = ctx()
  if (!c) return
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, c.currentTime + startDelay)
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(endFrequency, c.currentTime + startDelay + duration)
  }
  env.gain.setValueAtTime(gain, c.currentTime + startDelay)
  env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration)
  osc.connect(env)
  env.connect(c.destination)
  osc.start(c.currentTime + startDelay)
  osc.stop(c.currentTime + startDelay + duration + 0.01)
}

/** 90–100: rising arpeggio — uplifting chime */
export function sfxPerfect() {
  tone(523, 0.18, 0.22, 'sine', 0.00)   // C5
  tone(659, 0.18, 0.20, 'sine', 0.10)   // E5
  tone(784, 0.30, 0.18, 'sine', 0.20)   // G5
}

/** 70–89: clean single ding — positive confirmation */
export function sfxGood() {
  tone(660, 0.22, 0.18, 'sine', 0.00)   // E5
  tone(880, 0.25, 0.12, 'sine', 0.12)   // A5 (softer overtone)
}

/** 30–69: soft low thud — neutral, not discouraging */
export function sfxPartial() {
  tone(330, 0.20, 0.14, 'sine',     0.00)  // E4
  tone(262, 0.18, 0.10, 'triangle', 0.06)  // C4 lower layer
}

/** 0: dull thud — gentle failure cue */
export function sfxWrong() {
  tone(196, 0.25, 0.14, 'triangle', 0.00)  // G3
  tone(174, 0.20, 0.08, 'triangle', 0.08)  // F3 slight dissonance
}

/** Step advance swoosh — 300→600 Hz frequency sweep */
export function sfxAdvance() {
  tone(300, 0.18, 0.10, 'sine', 0, 600)
}

/** Picks the right SFX based on score */
export function sfxForScore(pts: number) {
  if (pts >= 90) sfxPerfect()
  else if (pts >= 70) sfxGood()
  else if (pts >= 30) sfxPartial()
  else sfxWrong()
}
