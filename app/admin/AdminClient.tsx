'use client'

import { useState, useEffect, useCallback } from 'react'

type Tab = 'overview' | 'logs' | 'users'

interface Stats {
  totalUsers: number
  totalLogs: number
  totalCompletions: number
  totalMistakes: number
  todayLogs: number
  avgScore: number
  scenarioStats: { id: string; name: string; thumbnail: string; completions: number }[]
  dailyStats: { date: string; count: number }[]
}

interface Log {
  id: string
  user_id: string
  userEmail: string
  user_input: string
  attempt: number
  difficulty: string
  keyword_used: boolean
  goal_achieved: boolean
  score: number
  npc_response: string | null
  feedback: string | null
  correction: string | null
  natural_expression: string | null
  advance_to_next: boolean
  is_korean_input: boolean
  created_at: string
  scenarios: { name: string; thumbnail: string } | null
}

interface User {
  id: string
  email: string
  createdAt: string
  lastSignIn: string | null
  profile: { character_name: string | null; avatar_emoji: string; difficulty: string } | null
  progress: { total: number; completed: number; totalScore: number }
  logs: { count: number; lastAt: string | null; avgScore: number }
}

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-blue-400'
  if (score >= 30) return 'text-yellow-400'
  return 'text-red-400'
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminClient({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // 필터
  const [filterKorean, setFilterKorean] = useState(false)
  const [filterMinScore, setFilterMinScore] = useState('')
  const [filterMaxScore, setFilterMaxScore] = useState('')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }, [])

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filterKorean) params.set('korean_only', 'true')
    if (filterMinScore) params.set('min_score', filterMinScore)
    if (filterMaxScore) params.set('max_score', filterMaxScore)
    const res = await fetch(`/api/admin/logs?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setLogsTotal(data.total)
      setLogsPage(page)
    }
    setLoading(false)
  }, [filterKorean, filterMinScore, filterMaxScore])

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?page=${page}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setUsersTotal(data.total)
      setUsersPage(page)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'overview') fetchStats()
    else if (tab === 'logs') fetchLogs(1)
    else if (tab === 'users') fetchUsers(1)
  }, [tab, fetchStats, fetchLogs, fetchUsers])

  const maxBarCount = stats ? Math.max(...stats.dailyStats.map(d => d.count), 1) : 1

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <span className="text-xl font-bold tracking-tight">⚙️ Admin</span>
        <span className="text-xs text-white/40 ml-auto">{userEmail}</span>
        <a href="/dashboard" className="text-xs text-white/40 hover:text-white transition-colors">← 대시보드</a>
      </header>

      {/* 탭 */}
      <nav className="flex gap-1 px-6 pt-4">
        {(['overview', 'logs', 'users'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {{ overview: '📊 개요', logs: '💬 대화 로그', users: '👥 유저' }[t]}
          </button>
        ))}
        <button
          onClick={() => {
            setLoading(true)
            if (tab === 'overview') fetchStats()
            else if (tab === 'logs') fetchLogs(logsPage)
            else fetchUsers(usersPage)
          }}
          className="ml-auto text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </nav>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        {/* ─── 개요 탭 ─── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: '전체 유저', value: stats.totalUsers, icon: '👥' },
                { label: '오늘 대화', value: stats.todayLogs, icon: '💬' },
                { label: '전체 대화', value: stats.totalLogs, icon: '📝' },
                { label: '완료 시나리오', value: stats.totalCompletions, icon: '✅' },
                { label: '전체 실수', value: stats.totalMistakes, icon: '❌' },
                { label: '평균 점수', value: `${stats.avgScore}점`, icon: '🎯' },
              ].map(m => (
                <div key={m.label} className="bg-white/5 rounded-xl p-4">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-xs text-white/40 mt-1">{m.label}</div>
                </div>
              ))}
            </div>

            {/* 일별 대화 수 (최근 7일) */}
            <div className="bg-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white/60 mb-4">최근 7일 대화 수</h3>
              <div className="flex items-end gap-2 h-24">
                {stats.dailyStats.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-white/40">{d.count}</span>
                    <div
                      className="w-full bg-indigo-500/60 rounded-t transition-all"
                      style={{ height: `${Math.round((d.count / maxBarCount) * 80)}px`, minHeight: d.count > 0 ? 4 : 0 }}
                    />
                    <span className="text-xs text-white/30">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시나리오별 완료 수 */}
            <div className="bg-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white/60 mb-4">시나리오별 완료 수</h3>
              <div className="space-y-2">
                {[...stats.scenarioStats].sort((a, b) => b.completions - a.completions).map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-lg w-8">{s.thumbnail}</span>
                    <span className="text-sm text-white/70 w-40">{s.name}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-indigo-400 h-2 rounded-full"
                        style={{ width: `${stats.totalCompletions > 0 ? (s.completions / stats.totalCompletions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{s.completions}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── 대화 로그 탭 ─── */}
        {tab === 'logs' && (
          <div className="space-y-4">
            {/* 필터 */}
            <div className="flex gap-3 flex-wrap items-center">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterKorean}
                  onChange={e => setFilterKorean(e.target.checked)}
                  className="accent-indigo-500"
                />
                한국어 입력만
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">점수</span>
                <input
                  type="number"
                  placeholder="최소"
                  value={filterMinScore}
                  onChange={e => setFilterMinScore(e.target.value)}
                  className="w-16 bg-white/10 rounded px-2 py-1 text-sm text-white placeholder:text-white/20 border border-white/10"
                />
                <span className="text-white/30">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={filterMaxScore}
                  onChange={e => setFilterMaxScore(e.target.value)}
                  className="w-16 bg-white/10 rounded px-2 py-1 text-sm text-white placeholder:text-white/20 border border-white/10"
                />
              </div>
              <button
                onClick={() => fetchLogs(1)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors"
              >
                필터 적용
              </button>
              <span className="text-sm text-white/30 ml-auto">총 {logsTotal.toLocaleString()}건</span>
            </div>

            {/* 로그 목록 */}
            <div className="space-y-2">
              {loading && <div className="text-white/30 text-sm text-center py-8">로딩 중...</div>}
              {!loading && logs.map(log => (
                <div
                  key={log.id}
                  className="bg-white/5 rounded-xl overflow-hidden border border-white/5"
                >
                  {/* 요약 행 */}
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg w-6">{log.scenarios?.thumbnail ?? '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                        <span>{log.userEmail}</span>
                        <span>·</span>
                        <span>{log.scenarios?.name ?? '알 수 없음'}</span>
                        <span>·</span>
                        <span>{fmt(log.created_at)}</span>
                        {log.is_korean_input && (
                          <span className="bg-yellow-500/20 text-yellow-400 px-1.5 rounded text-xs">한국어</span>
                        )}
                        <span className={`ml-auto font-bold ${scoreColor(log.score)}`}>{log.score}점</span>
                        <span className={log.goal_achieved ? 'text-emerald-400' : 'text-red-400'}>
                          {log.goal_achieved ? '✓' : '✗'}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 truncate">{log.user_input}</p>
                    </div>
                    <span className="text-white/20 text-xs">{expandedLog === log.id ? '▲' : '▼'}</span>
                  </button>

                  {/* 상세 */}
                  {expandedLog === log.id && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/50">
                        <span>시도: {log.attempt}회</span>
                        <span>난이도: {log.difficulty}</span>
                        <span>키워드 사용: {log.keyword_used ? '✓' : '✗'}</span>
                        <span>다음 진행: {log.advance_to_next ? '✓' : '✗'}</span>
                      </div>
                      {log.npc_response && (
                        <div>
                          <span className="text-xs text-white/30 block mb-1">NPC 응답</span>
                          <p className="text-sm text-blue-300 bg-blue-500/10 rounded p-2">{log.npc_response}</p>
                        </div>
                      )}
                      {log.feedback && (
                        <div>
                          <span className="text-xs text-white/30 block mb-1">피드백</span>
                          <p className="text-sm text-white/70 bg-white/5 rounded p-2">{log.feedback}</p>
                        </div>
                      )}
                      {log.natural_expression && (
                        <div>
                          <span className="text-xs text-white/30 block mb-1">추천 표현</span>
                          <p className="text-sm text-emerald-300 bg-emerald-500/10 rounded p-2">&quot;{log.natural_expression}&quot;</p>
                        </div>
                      )}
                      {log.correction && (
                        <div>
                          <span className="text-xs text-white/30 block mb-1">교정</span>
                          <p className="text-sm text-yellow-300 bg-yellow-500/10 rounded p-2">{log.correction}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {logsTotal > 50 && (
              <div className="flex gap-2 justify-center pt-2">
                <button
                  disabled={logsPage <= 1}
                  onClick={() => fetchLogs(logsPage - 1)}
                  className="px-3 py-1 bg-white/10 rounded text-sm disabled:opacity-30"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm text-white/40">
                  {logsPage} / {Math.ceil(logsTotal / 50)}
                </span>
                <button
                  disabled={logsPage >= Math.ceil(logsTotal / 50)}
                  onClick={() => fetchLogs(logsPage + 1)}
                  className="px-3 py-1 bg-white/10 rounded text-sm disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── 유저 탭 ─── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/40">총 {usersTotal}명</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-white/30 border-b border-white/10">
                    <th className="pb-3 pr-4">유저</th>
                    <th className="pb-3 pr-4">캐릭터</th>
                    <th className="pb-3 pr-4">난이도</th>
                    <th className="pb-3 pr-4 text-right">완료</th>
                    <th className="pb-3 pr-4 text-right">대화 수</th>
                    <th className="pb-3 pr-4 text-right">평균 점수</th>
                    <th className="pb-3 text-right">마지막 활동</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-white/30">로딩 중...</td>
                    </tr>
                  )}
                  {!loading && users.map(u => (
                    <tr key={u.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="text-white/80">{u.email}</div>
                        <div className="text-xs text-white/30">{fmt(u.createdAt)} 가입</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="mr-1">{u.profile?.avatar_emoji ?? '🧑‍💼'}</span>
                        <span className="text-white/60">{u.profile?.character_name ?? '-'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          u.profile?.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                          u.profile?.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {u.profile?.difficulty ?? 'normal'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-white/60">
                        {u.progress.completed} / {u.progress.total}
                      </td>
                      <td className="py-3 pr-4 text-right text-white/60">{u.logs.count}</td>
                      <td className={`py-3 pr-4 text-right font-medium ${scoreColor(u.logs.avgScore)}`}>
                        {u.logs.avgScore > 0 ? `${u.logs.avgScore}점` : '-'}
                      </td>
                      <td className="py-3 text-right text-white/40 text-xs">
                        {fmt(u.logs.lastAt ?? u.lastSignIn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {usersTotal > 20 && (
              <div className="flex gap-2 justify-center pt-2">
                <button
                  disabled={usersPage <= 1}
                  onClick={() => fetchUsers(usersPage - 1)}
                  className="px-3 py-1 bg-white/10 rounded text-sm disabled:opacity-30"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm text-white/40">
                  {usersPage} / {Math.ceil(usersTotal / 20)}
                </span>
                <button
                  disabled={usersPage >= Math.ceil(usersTotal / 20)}
                  onClick={() => fetchUsers(usersPage + 1)}
                  className="px-3 py-1 bg-white/10 rounded text-sm disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
