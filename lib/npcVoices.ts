/**
 * NPC voice profiles for Web Speech API.
 * Strategy: try preferred voice names → fallback to gender match → fallback to pitch/rate only.
 */

export type NPCVoiceProfile = {
  /** Preferred voice name substrings, in priority order */
  preferredNames: string[]
  /** 'male' | 'female' — used as tiebreaker when no preferred name matches */
  gender: 'male' | 'female'
  pitch: number   // 0.1–2.0 (default 1.0)
  rate: number    // 0.1–10  (default 1.0)
}

export const NPC_VOICE_PROFILES: Record<string, NPCVoiceProfile> = {
  /** SARAH — friendly waitress, warm American female */
  SARAH: {
    preferredNames: ['Samantha', 'Google US English', 'Zira', 'Victoria', 'Ava'],
    gender: 'female',
    pitch: 1.1,
    rate: 1.05,
  },
  /** MIKE — professional airline staff, clear British/American male */
  MIKE: {
    preferredNames: ['Daniel', 'Google UK English Male', 'Mark', 'Alex', 'David'],
    gender: 'male',
    pitch: 0.88,
    rate: 0.97,
  },
  /** EMMA — elegant hotel concierge, polished British female */
  EMMA: {
    preferredNames: ['Google UK English Female', 'Kate', 'Moira', 'Karen', 'Tessa'],
    gender: 'female',
    pitch: 0.98,
    rate: 0.92,
  },
  /** LUCY — cheerful barista, bubbly American female */
  LUCY: {
    preferredNames: ['Samantha', 'Google US English', 'Victoria', 'Zira', 'Ava'],
    gender: 'female',
    pitch: 1.22,
    rate: 1.12,
  },
  /** JAMES — chatty cab driver, laid-back American male */
  JAMES: {
    preferredNames: ['Google US English Male', 'Fred', 'Alex', 'Tom', 'Aaron'],
    gender: 'male',
    pitch: 0.95,
    rate: 1.07,
  },
  /** KATE — upbeat store clerk, energetic American female */
  KATE: {
    preferredNames: ['Allison', 'Google US English', 'Samantha', 'Susan', 'Zira'],
    gender: 'female',
    pitch: 1.15,
    rate: 1.1,
  },
  /** CHEN — calm pharmacist, measured American male */
  CHEN: {
    preferredNames: ['Google US English Male', 'Daniel', 'Alex', 'Arthur', 'Bruce'],
    gender: 'male',
    pitch: 0.85,
    rate: 0.93,
  },
}

/** Cached selection: npcName → SpeechSynthesisVoice | null */
const voiceCache: Record<string, SpeechSynthesisVoice | null> = {}

function pickVoice(profile: NPCVoiceProfile): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const englishVoices = voices.filter(v => v.lang.startsWith('en'))
  if (!englishVoices.length) return null

  // 1. Try preferred names (substring match, case-insensitive)
  for (const name of profile.preferredNames) {
    const match = englishVoices.find(v =>
      v.name.toLowerCase().includes(name.toLowerCase())
    )
    if (match) return match
  }

  // 2. Gender heuristic — voices with "female"/"male" in the name
  const genderKeyword = profile.gender
  const genderMatch = englishVoices.find(v =>
    v.name.toLowerCase().includes(genderKeyword)
  )
  if (genderMatch) return genderMatch

  // 3. Fallback: split by index parity (odd = 'male', even = 'female')
  if (profile.gender === 'female') {
    return englishVoices.find((_, i) => i % 2 === 0) ?? englishVoices[0]
  }
  return englishVoices.find((_, i) => i % 2 === 1) ?? englishVoices[0]
}

/**
 * Returns the best SpeechSynthesisVoice for an NPC, with caching.
 * Call after voices are loaded (voiceschanged or inside speak()).
 */
export function getNPCVoice(npcName: string): SpeechSynthesisVoice | null {
  if (npcName in voiceCache) return voiceCache[npcName]
  const profile = NPC_VOICE_PROFILES[npcName]
  if (!profile) return null
  const voice = pickVoice(profile)
  voiceCache[npcName] = voice
  return voice
}

export function applyNPCVoice(
  utt: SpeechSynthesisUtterance,
  npcName: string,
  speedMultiplier = 1.0,
) {
  const profile = NPC_VOICE_PROFILES[npcName]
  if (!profile) { utt.lang = 'en-US'; return }

  const voice = getNPCVoice(npcName)
  if (voice) utt.voice = voice
  utt.lang = voice?.lang ?? 'en-US'
  utt.pitch = profile.pitch
  utt.rate  = profile.rate * speedMultiplier
}
