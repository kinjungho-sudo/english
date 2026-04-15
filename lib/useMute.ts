'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'tq_muted'

/** localStorage 기반 음소거 훅 — 탭 간 동기화 포함 */
export function useMute() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(KEY) === '1'
  })

  const setMuted = useCallback((val: boolean) => {
    localStorage.setItem(KEY, val ? '1' : '0')
    setMutedState(val)
    // 다른 탭 동기화
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: val ? '1' : '0' }))
  }, [])

  const toggle = useCallback(() => setMuted(!muted), [muted, setMuted])

  // 다른 탭에서 변경 시 동기화
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setMutedState(e.newValue === '1')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { muted, setMuted, toggle }
}
