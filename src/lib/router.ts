import { useEffect, useState } from 'react'

/**
 * Hash routes, so each tab has its own address, the phone's back gesture works,
 * and Vercel needs no rewrite rules:
 *   #/today   #/habits   #/habits/<id>   #/insights
 */
export type Route =
  | { tab: 'today' }
  | { tab: 'habits' }
  | { tab: 'habits'; habitId: number }
  | { tab: 'insights' }

export function parseRoute(hash: string): Route {
  const [, tab, id] = hash.replace(/^#/, '').split('/')
  if (tab === 'habits' && id && /^\d+$/.test(id)) return { tab: 'habits', habitId: Number(id) }
  if (tab === 'habits') return { tab: 'habits' }
  if (tab === 'insights') return { tab: 'insights' }
  return { tab: 'today' }
}

export const href = {
  today: '#/today',
  habits: '#/habits',
  habit: (id: number) => `#/habits/${id}`,
  insights: '#/insights',
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
