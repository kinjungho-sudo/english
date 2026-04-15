'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo, calculateXP, LEVELS } from '@/lib/levels'
import { useMute } from '@/lib/useMute'
import ActivityCalendar from '@/components/ActivityCalendar'
import type { UserProgress, UserMistake, Scenario } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Profile = {
  character_name: string
  avatar_emoji: string
  difficulty: string
  tts_autoplay: boolean
  hint_enabled: boolean
}

type Props = {
  user: User
  profile: Profile
  progress: UserProgress[]
  mastered: UserMistake[]
  unmastered: UserMistake[]
  scenarios: Scenario[]
  activityDates: string[]
  streak: number
}

const AVATARS = ['🧑‍💼', '👩‍✈️', '🧑‍🍳', '🧝', '🦸', '🧙', '👨‍🎓', '🧑‍🚀']

const DIFFICULTIES = [
  { key: 'easy',   label: '쉬움',   desc: '정답이 보임 · 따라 말하기',  color: 'text-green-400',  border: 'border-green-600/40', bg: 'bg-green-900/20' },
  { key: 'normal', label: '보통',   desc: '힌트·번역 사용 가능',         color: 'text-amber-400',  border: 'border-amber-600/40', bg: 'bg-amber-900/20' },
  { key: 'hard',   label: '어려움', desc: '도움 없이 혼자 해결',          color: 'text-red-400',    border: 'border-red-600/40',   bg: 'bg-red-900/20' },
]

export default function ProfileClient({ user, profile, progress, mastered, unmastered, scenarios, activityDates, streak }: Props) {
  void user
  const router = useRouter()
  const supabase = createClient()
  const { muted, setMuted } = useMute()

  const [characterName, setCharacterName] = useState(profile.character_name)
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatar_emoji)
  const [difficulty, setDifficulty] = useState(profile.difficulty)
  const [ttsAutoplay, setTtsAutoplay] = useState(profile.tts_autoplay)
  const [hintEnabled, setHintEnabled] = useState(profile.hint_enabled)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.character_name)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const totalScore = progress.reduce((sum, p) => sum + (p.total_score ?? 0), 0)
  const masteredCount = mastered.length
  const completedCount = progress.filter(p => !!p.completed_at).length
  const xp = calculateXP(totalScore, masteredCount, completedCount)
  const levelInfo = getLevelInfo(xp)
  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]))

  async function saveProfile(patch: Partial<Profile>) {
    setSaving(true)
    await supabase.from('profiles').update(patch).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSaving(false)
    setSaveMsg('저장됨')
    setTimeout(() => setSaveMsg(''), 2000)
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

  return (
    <div className="game-wrap bg-gray-950">
      <div className="game-card bg-gray-950">

        {/* Header */}
        <header className="shrink-0 border-b border-gray-800/50 px-5 py-4 flex items-center justify-between bg-gray-950 z-10">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← 홈으로
          </Link>
          <span className="text-[11px] text-gray-600 tracking-widest uppercase">마이 페이지</span>
          <button onClick={signOut} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
            로그아웃
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

          {/* ── 캐릭터 카드 ── */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(10,10,15,0.95) 60%)',
              border: '1px solid rgba(168,85,247,0.18)',
              boxShadow: '0 0 40px rgba(168,85,247,0.05)',
            }}
          >
            <div className="flex items-center gap-4">
              {/* 아바타 */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                style={{
                  background: 'radial-gradient(circle, rgba(168,85,247,0.15), rgba(0,0,0,0.5))',
                  border: '1.5px solid rgba(168,85,247,0.25)',
                }}
              >
                {avatarEmoji}
              </div>

              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      maxLength={16}
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false) }}
                      className="bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 text-white text-base font-bold focus:outline-none w-36"
                    />
                    <button onClick={handleNameSave} className="text-purple-400 text-xs font-bold hover:text-purple-300">저장</button>
                    <button onClick={() => setEditingName(false)} className="text-gray-600 text-xs hover:text-gray-400">취소</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{characterName}</h2>
                    <button onClick={() => { setNameInput(characterName); setEditingName(true) }} className="text-gray-600 hover:text-purple-400 transition-colors text-xs">✎</button>
                  </div>
                )}
                <p className="text-[11px] text-purple-400/60 font-bold tracking-widest uppercase mt-0.5">
                  {levelInfo.emoji} Lv.{levelInfo.level} · {levelInfo.title}
                </p>
              </div>

              {saveMsg && (
                <span className="text-green-400/70 text-xs shrink-0">{saveMsg}</span>
              )}
            </div>

            {/* 아바타 선택 */}
            <div className="mt-4 grid grid-cols-8 gap-1.5">
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAvatarChange(emoji)}
                  className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                    avatarEmoji === emoji
                      ? 'bg-purple-600/30 border border-purple-500/50 scale-110'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* XP 바 */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">{xp.toLocaleString()} XP</span>
                {levelInfo.nextLevel
                  ? <span className="text-gray-600">다음 레벨까지 {(levelInfo.nextLevel.minXP - xp).toLocaleString()} XP</span>
                  : <span className="text-purple-400 font-bold">최고 레벨 달성!</span>
                }
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${levelInfo.progress}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.4)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── 스탯 ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '점수', value: totalScore.toLocaleString(), icon: '⭐' },
              { label: '완벽 표현', value: masteredCount, icon: '✓' },
              { label: '클리어', value: `${completedCount}/${scenarios.length}`, icon: '🏁' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 text-center">
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-white font-black text-base">{stat.value}</div>
                <div className="text-gray-600 text-[10px] tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── 게임 난이도 ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">게임 난이도</h3>
            <div className="space-y-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.key}
                  onClick={() => handleDifficultyChange(d.key)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-all text-left ${
                    difficulty === d.key
                      ? `${d.bg} ${d.border}`
                      : 'border-transparent hover:bg-white/4'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${difficulty === d.key ? d.color.replace('text-', 'bg-') : 'bg-gray-700'}`} />
                  <div className="flex-1">
                    <p className={`text-xs font-black tracking-widest ${difficulty === d.key ? d.color : 'text-gray-500'}`}>
                      {d.label}
                    </p>
                    <p className="text-gray-600 text-[11px] mt-0.5">{d.desc}</p>
                  </div>
                  {difficulty === d.key && <span className={`text-xs ${d.color}`}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── 게임 설정 ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">게임 설정</h3>
            <div className="space-y-0 divide-y divide-gray-800/60">

              {/* 음소거 — localStorage 기반, 즉각 반영 */}
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                    {muted ? '🔇' : '🔊'} 음소거
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">NPC 음성 및 효과음 전체 음소거</p>
                </div>
                <button
                  onClick={() => setMuted(!muted)}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ml-4 ${
                    muted ? 'bg-red-500/70' : 'bg-gray-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    muted ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {[
                {
                  key: 'tts_autoplay' as const,
                  label: 'TTS 자동 재생',
                  desc: 'NPC 대사 타이핑 완료 시 자동 음성 재생',
                  value: ttsAutoplay,
                },
                {
                  key: 'hint_enabled' as const,
                  label: '힌트 버튼',
                  desc: '게임 화면에 힌트 보기 버튼 표시',
                  value: hintEnabled,
                },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{setting.label}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.key, !setting.value)}
                    disabled={saving}
                    className={`w-11 h-6 rounded-full transition-all relative shrink-0 ml-4 ${
                      setting.value ? 'bg-amber-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      setting.value ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── 레벨 로드맵 ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-4">레벨 로드맵</h3>
            <div className="space-y-2">
              {LEVELS.map(l => {
                const isUnlocked = xp >= l.minXP
                const isCurrent = l.level === levelInfo.level
                return (
                  <div key={l.level} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isCurrent ? 'bg-amber-900/20 border border-amber-700/30' : 'border border-transparent'
                  }`}>
                    <div className={`text-xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{l.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-amber-400' : isUnlocked ? 'text-white' : 'text-gray-700'}`}>
                          Lv.{l.level} {l.title}
                        </span>
                        {isCurrent && <span className="text-[10px] bg-amber-900/50 text-amber-400 border border-amber-700/40 rounded px-1.5 py-0.5">현재</span>}
                      </div>
                      <div className="text-xs text-gray-600">{l.minXP.toLocaleString()} XP~</div>
                    </div>
                    {isUnlocked && !isCurrent && <span className="text-green-500 text-sm">✓</span>}
                    {!isUnlocked && <span className="text-gray-700 text-sm">🔒</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 마스터된 표현 ── */}
          {mastered.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-4">
                완벽하게 익힌 표현 ({mastered.length})
              </h3>
              <div className="space-y-2">
                {mastered.slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
                    <span className="text-green-500 text-xs mt-0.5">✓</span>
                    <div>
                      <p className="text-green-300 text-sm font-medium">{`"${m.correct_expression}"`}</p>
                      {m.context && <p className="text-gray-600 text-xs mt-0.5">{m.context.slice(0, 60)}…</p>}
                    </div>
                  </div>
                ))}
                {mastered.length > 10 && (
                  <p className="text-gray-600 text-xs text-center pt-2">+{mastered.length - 10}개 더</p>
                )}
              </div>
            </div>
          )}

          {/* ── 복습 필요 ── */}
          {unmastered.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                다시 연습할 표현 ({unmastered.length})
              </h3>
              <p className="text-gray-600 text-[11px] mb-4">탭하면 해당 시나리오로 바로 이동해요</p>
              <div className="space-y-2">
                {unmastered.slice(0, 5).map(m => {
                  const sc = scenarioMap[m.scenario_id]
                  return (
                    <Link
                      key={m.id}
                      href={`/scenario/${m.scenario_id}`}
                      className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl border border-transparent hover:bg-amber-900/15 hover:border-amber-700/25 transition-all group"
                    >
                      <span className="text-amber-500 text-xs shrink-0">△</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-200 text-sm truncate">{`"${m.correct_expression}"`}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{sc?.thumbnail} {sc?.name} · {m.mistake_count}회 틀림</p>
                      </div>
                      <span className="text-gray-700 group-hover:text-amber-600 text-xs transition-colors shrink-0">→</span>
                    </Link>
                  )
                })}
                {unmastered.length > 5 && (
                  <p className="text-gray-600 text-xs text-center pt-2">+{unmastered.length - 5}개 더</p>
                )}
              </div>
            </div>
          )}

          {/* ── 출석 달력 ── */}
          <ActivityCalendar activeDates={activityDates} streak={streak} />

          <div className="pb-6" />
        </div>
      </div>
    </div>
  )
}
