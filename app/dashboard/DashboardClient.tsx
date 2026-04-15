'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getLevelInfo, calculateXP } from '@/lib/levels'
import OnboardingModal from '@/components/OnboardingModal'
import ActivityCalendar from '@/components/ActivityCalendar'
import type { Scenario, UserProgress, UserMistake } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
  characterName: string
  avatarEmoji: string
  difficulty: string
  ttsAutoplay: boolean
  hintEnabled: boolean
  scenarios: Scenario[]
  progress: UserProgress[]
  unmastered: UserMistake[]
  mastered: UserMistake[]
}

const DIFFICULTIES = [
  { key: 'easy',   label: '쉬움',   desc: '문법 오류 관대히',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)'  },
  { key: 'normal', label: '보통',   desc: '표준 기준',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)'  },
  { key: 'hard',   label: '어려움', desc: '정확한 표현만',      color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
]

const AVATARS = ['🧑‍💼', '👩‍✈️', '🧑‍🍳', '🧝', '🦸', '🧙', '👨‍🎓', '🧑‍🚀']

// Accent colors match .dialogue-nameplate-* in globals.css
const NPC_CARD_THEME: Record<string, { bg: string; border: string; accent: string }> = {
  SARAH: { bg: 'rgba(234,88,12,0.08)',   border: 'rgba(234,88,12,0.22)',   accent: '#ea580c' },
  MIKE:  { bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.22)',   accent: '#2563eb' },
  EMMA:  { bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.22)',  accent: '#7c3aed' },
  LUCY:  { bg: 'rgba(180,83,9,0.08)',    border: 'rgba(180,83,9,0.22)',    accent: '#b45309' },
  JAMES: { bg: 'rgba(133,77,14,0.08)',   border: 'rgba(133,77,14,0.22)',   accent: '#854d0e' },
  KATE:  { bg: 'rgba(190,24,93,0.08)',   border: 'rgba(190,24,93,0.22)',   accent: '#be185d' },
  CHEN:  { bg: 'rgba(15,118,110,0.08)',  border: 'rgba(15,118,110,0.22)',  accent: '#0f766e' },
}

export default function DashboardClient({ user, characterName: initialCharacterName, avatarEmoji: initialAvatarEmoji, difficulty: initialDifficulty, ttsAutoplay: initialTts, hintEnabled: initialHint, scenarios, progress, unmastered, mastered }: Props) {
  void user
  const router = useRouter()
  const supabase = createClient()

  const [showOnboarding, setShowOnboarding] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('sq_onboarded')
  )
  const [showSettings, setShowSettings] = useState(false)
  const [streak, setStreak] = useState(0)
  const [activeDates, setActiveDates] = useState<string[]>([])

  // Settings state (mirrors profile)
  const [characterName, setCharacterName] = useState(initialCharacterName)
  const [avatarEmoji, setAvatarEmoji] = useState(initialAvatarEmoji)
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [ttsAutoplay, setTtsAutoplay] = useState(initialTts)
  const [hintEnabled, setHintEnabled] = useState(initialHint)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(initialCharacterName)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    // streak 기록 + activity 날짜 병렬 로드
    Promise.all([
      fetch('/api/streak', { method: 'POST' }).then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
    ]).then(([streakData, activityData]) => {
      setStreak(streakData.streak ?? 0)
      setActiveDates(activityData.dates ?? [])
    }).catch(() => {})
  }, [])

  function closeOnboarding() {
    localStorage.setItem('sq_onboarded', '1')
    setShowOnboarding(false)
  }

  async function saveProfile(patch: Record<string, unknown>) {
    setSaving(true)
    await supabase.from('profiles').update(patch).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSaving(false)
    setSaveMsg('저장됨')
    setTimeout(() => setSaveMsg(''), 1800)
  }

  async function handleNameSave() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed.length < 2) return
    setCharacterName(trimmed)
    setEditingName(false)
    await saveProfile({ character_name: trimmed })
    router.refresh()
  }

  async function handleAvatarChange(emoji: string) {
    setAvatarEmoji(emoji)
    await saveProfile({ avatar_emoji: emoji })
  }

  async function handleDifficultyChange(d: string) {
    setDifficulty(d)
    await saveProfile({ difficulty: d })
  }

  async function handleToggle(key: 'tts_autoplay' | 'hint_enabled', val: boolean) {
    if (key === 'tts_autoplay') setTtsAutoplay(val)
    else setHintEnabled(val)
    await saveProfile({ [key]: val })
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const progressMap = Object.fromEntries(progress.map(p => [p.scenario_id, p]))
  const mistakeCountByScenario = unmastered.reduce<Record<string, number>>((acc, m) => {
    acc[m.scenario_id] = (acc[m.scenario_id] ?? 0) + 1
    return acc
  }, {})

  const totalScore = progress.reduce((sum, p) => sum + (p.total_score ?? 0), 0)
  const completedCount = progress.filter(p => !!p.completed_at).length
  const xp = calculateXP(totalScore, mastered.length, completedCount)
  const levelInfo = getLevelInfo(xp)

  const hasReviewItems = unmastered.length > 0

  const thisMonth = new Date().toISOString().slice(0, 7)
  const masteredThisMonth = mastered.filter(m => m.mastered_at?.startsWith(thisMonth)).length
  const top3Mistakes = [...unmastered]
    .sort((a, b) => b.mistake_count - a.mistake_count)
    .slice(0, 3)

  return (
    <div className="game-wrap bg-gray-950">
      <div className="game-card bg-gray-950 relative">
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

        {/* Header */}
        <header
          className="shrink-0 border-b px-5 py-3 flex items-center justify-between z-10"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(10,10,15,0.95))',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <span className="font-black text-white tracking-widest text-sm uppercase">Travel Quest</span>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <div
                className="flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                <span className="text-sm leading-none">🔥</span>
                <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>{streak}일</span>
              </div>
            )}

            {/* Character card with level badge */}
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl pl-2 pr-3 py-1.5 transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <div className="relative">
                <span className="text-xl leading-none">{avatarEmoji}</span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full font-black leading-none"
                  style={{ background: '#f59e0b', color: '#000', fontSize: '9px' }}
                >
                  {levelInfo.level}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold leading-none" style={{ color: 'rgba(255,255,255,0.82)' }}>{characterName}</p>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(245,158,11,0.55)' }}>{levelInfo.title}</p>
              </div>
            </Link>

            {/* 설정 버튼 */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="설정"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ════ 설정 바텀시트 ════ */}
        {showSettings && (
          <div
            className="absolute inset-0 z-50 flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}
          >
            <div
              className="rounded-t-3xl flex flex-col animate-fade-in-up"
              style={{
                background: 'linear-gradient(to bottom, #111318, #0d0f14)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                maxHeight: '88vh',
              }}
            >
              {/* 핸들 + 헤더 */}
              <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </div>
                  <span className="font-black text-white text-sm tracking-wide">설정</span>
                </div>
                <div className="flex items-center gap-3">
                  {saveMsg && <span className="text-[11px] font-bold" style={{ color: '#4ade80' }}>{saveMsg}</span>}
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* ── 캐릭터 ── */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>캐릭터</p>

                  {/* 아바타 + 이름 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      {avatarEmoji}
                    </div>
                    {editingName ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          maxLength={16}
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false) }}
                          className="flex-1 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
                        />
                        <button onClick={handleNameSave} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>저장</button>
                        <button onClick={() => setEditingName(false)} className="text-xs text-gray-600 hover:text-gray-400 px-2">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-bold text-white text-sm">{characterName}</span>
                        <button onClick={() => { setNameInput(characterName); setEditingName(true) }} className="text-gray-600 hover:text-amber-400 transition-colors text-xs">✎</button>
                      </div>
                    )}
                  </div>

                  {/* 아바타 선택 */}
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATARS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleAvatarChange(emoji)}
                        disabled={saving}
                        className="aspect-square rounded-xl text-xl flex items-center justify-center transition-all"
                        style={{
                          background: avatarEmoji === emoji ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${avatarEmoji === emoji ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          transform: avatarEmoji === emoji ? 'scale(1.1)' : undefined,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </section>

                {/* ── 난이도 ── */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>게임 난이도</p>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d.key}
                        onClick={() => handleDifficultyChange(d.key)}
                        disabled={saving}
                        className="flex-1 py-3 rounded-2xl text-center transition-all"
                        style={{
                          background: difficulty === d.key ? d.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${difficulty === d.key ? d.border : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        <p className="text-xs font-black" style={{ color: difficulty === d.key ? d.color : 'rgba(255,255,255,0.3)' }}>
                          {d.label}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: difficulty === d.key ? d.color + '88' : 'rgba(255,255,255,0.12)' }}>
                          {d.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* ── 게임 설정 ── */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>게임 설정</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      {
                        key: 'tts_autoplay' as const,
                        label: 'TTS 자동 재생',
                        desc: 'NPC 대사 타이핑 완료 시 자동 음성',
                        value: ttsAutoplay,
                      },
                      {
                        key: 'hint_enabled' as const,
                        label: '힌트 표시',
                        desc: '게임 중 힌트 보기 버튼 표시',
                        value: hintEnabled,
                      },
                    ].map((s, i) => (
                      <div
                        key={s.key}
                        className="flex items-center justify-between px-4 py-3.5"
                        style={{
                          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggle(s.key, !s.value)}
                          disabled={saving}
                          className="relative shrink-0 ml-4 transition-all"
                          style={{
                            width: '44px', height: '24px',
                            borderRadius: '12px',
                            background: s.value ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                          }}
                        >
                          <div
                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                            style={{ left: s.value ? '22px' : '2px' }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── 계정 ── */}
                <section className="pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>계정</p>
                  <div className="flex gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setShowSettings(false)}
                      className="flex-1 py-3 rounded-2xl text-center text-xs font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      마이페이지 →
                    </Link>
                    <button
                      onClick={signOut}
                      className="flex-1 py-3 rounded-2xl text-center text-xs font-bold transition-all"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.6)' }}
                    >
                      로그아웃
                    </button>
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-5 py-8">
          {/* Review Alert */}
          {hasReviewItems && (
            <div
              className="rounded-2xl p-4 mb-6 animate-fade-in-up"
              style={{ background: 'rgba(120,53,15,0.2)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#fcd34d' }}>복습할 표현이 있어요!</p>
                  <p className="text-xs" style={{ color: 'rgba(245,158,11,0.55)' }}>
                    이전에 틀렸던 표현 <strong style={{ color: '#fcd34d' }}>{unmastered.length}개</strong>가 우선 출제됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* XP / Level card */}
          <Link
            href="/profile"
            className="block rounded-2xl p-4 mb-6 transition-colors"
            style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-white">{levelInfo.emoji} {levelInfo.title}</span>
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Lv.{levelInfo.level}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${levelInfo.progress}%`,
                  background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 8px rgba(245,158,11,0.5)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{ color: 'rgba(75,85,99,0.9)' }}>{xp.toLocaleString()} XP</span>
              <span className="text-xs font-bold" style={{ color: 'rgba(245,158,11,0.5)' }}>{levelInfo.progress}% · 마이페이지 →</span>
            </div>
          </Link>

          {/* 출석 달력 */}
          <ActivityCalendar activeDates={activeDates} streak={streak} />

          {/* 학습 통계 */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(75,85,99,0.9)' }}>이번 달 마스터</p>
              <p className="text-2xl font-black text-white leading-none">
                {masteredThisMonth}<span className="text-sm font-normal ml-1" style={{ color: 'rgba(75,85,99,0.9)' }}>개</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(55,65,81,0.9)' }}>표현 습득 완료</p>
            </div>
            <div className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(75,85,99,0.9)' }}>전체 마스터</p>
              <p className="text-2xl font-black text-white leading-none">
                {mastered.length}<span className="text-sm font-normal ml-1" style={{ color: 'rgba(75,85,99,0.9)' }}>개</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(55,65,81,0.9)' }}>누적 표현 수</p>
            </div>
          </div>

          {/* TOP 3 오답 */}
          {top3Mistakes.length > 0 && (
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(17,24,39,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(75,85,99,0.9)' }}>
                📊 많이 틀린 표현 TOP {top3Mistakes.length}
              </p>
              <div className="space-y-2">
                {top3Mistakes.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black w-4 shrink-0" style={{ color: 'rgba(75,85,99,0.8)' }}>{i + 1}</span>
                    <p className="text-xs flex-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.correct_expression || m.wrong_input}</p>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'rgba(248,113,113,0.6)' }}>{m.mistake_count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-xl font-black text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
            STAGE SELECT
          </h1>
          <p className="text-xs mb-5 tracking-wider uppercase" style={{ color: 'rgba(75,85,99,0.8)' }}>시나리오를 선택하세요</p>

          {/* Scenario cards — NPC-themed with CLEAR glow */}
          <div className="space-y-3">
            {scenarios.map(scenario => {
              const prog = progressMap[scenario.id]
              const reviewCount = mistakeCountByScenario[scenario.id] ?? 0
              const isCompleted = !!prog?.completed_at
              const stepsCompleted = prog?.steps_completed ?? 0
              const theme = NPC_CARD_THEME[scenario.npc_name] ?? {
                bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.08)', accent: '#6b7280',
              }

              return (
                <Link
                  key={scenario.id}
                  href={`/scenario/${scenario.id}`}
                  className={`block rounded-2xl p-5 transition-all group relative overflow-hidden ${isCompleted ? 'animate-clear-glow' : ''}`}
                  style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${theme.bg} 0%, transparent 65%), rgba(17,24,39,0.9)`,
                    border: `1px solid ${isCompleted ? 'rgba(245,158,11,0.4)' : theme.border}`,
                  }}
                >
                  {/* Left NPC accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: theme.accent, opacity: isCompleted ? 1 : 0.65 }}
                  />

                  <div className="flex items-center gap-4 pl-2">
                    <div className="text-3xl">{scenario.thumbnail}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h2 className="font-bold group-hover:text-amber-300 transition-colors" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          {scenario.name}
                        </h2>
                        {/* CLEAR golden badge */}
                        {isCompleted && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold tracking-wider"
                            style={{
                              background: 'rgba(245,158,11,0.15)',
                              border: '1px solid rgba(245,158,11,0.4)',
                              color: '#fbbf24',
                            }}
                          >
                            ✓ CLEAR
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(120,53,15,0.3)', color: '#fbbf24', border: '1px solid rgba(180,83,9,0.4)' }}
                          >
                            🔄 {reviewCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(75,85,99,0.9)' }}>{scenario.location}</p>
                    </div>
                    <div className="text-lg shrink-0 group-hover:text-amber-400 transition-colors" style={{ color: 'rgba(75,85,99,0.7)' }}>
                      ▶
                    </div>
                  </div>

                  {stepsCompleted > 0 && !isCompleted && (
                    <div className="mt-3 pl-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(stepsCompleted / 5) * 100}%`, background: theme.accent, opacity: 0.75 }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
