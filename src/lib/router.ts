import { useEffect, useState } from 'react'

/**
 * Hash routes, so each tab has its own address, the phone's back gesture works,
 * and Vercel needs no rewrite rules:
 *   #/today   #/tasks/<id>   #/habits   #/habits/<id>   #/insights   #/settings
 */
export type Route =
  | { tab: 'today' }
  | { tab: 'today'; taskId: number }
  | { tab: 'habits' }
  | { tab: 'habits'; habitId: number }
  | { tab: 'insights' }
  | { tab: 'settings' }
  | { tab: 'settings'; page: 'history' }

export function parseRoute(hash: string): Route {
  const [, tab, id] = hash.replace(/^#/, '').split('/')
  if (tab === 'tasks' && id && /^\d+$/.test(id)) return { tab: 'today', taskId: Number(id) }
  if (tab === 'habits' && id && /^\d+$/.test(id)) return { tab: 'habits', habitId: Number(id) }
  if (tab === 'habits') return { tab: 'habits' }
  if (tab === 'insights') return { tab: 'insights' }
  if (tab === 'settings' && id === 'history') return { tab: 'settings', page: 'history' }
  if (tab === 'settings') return { tab: 'settings' }
  return { tab: 'today' }
}

export const href = {
  today: '#/today',
  task: (id: number) => `#/tasks/${id}`,
  habits: '#/habits',
  habit: (id: number) => `#/habits/${id}`,
  insights: '#/insights',
  settings: '#/settings',
  history: '#/settings/history',
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
