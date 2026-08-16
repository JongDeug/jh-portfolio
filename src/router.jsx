// History API 라우터 — 경로 3개에 react-router는 과함
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

import { useEffect, useState } from 'react'

const strip = () => {
  const p = location.pathname
  return (p.startsWith(BASE) ? p.slice(BASE.length) : p) || '/'
}

export function usePath() {
  const [path, setPath] = useState(strip)
  useEffect(() => {
    const on = () => setPath(strip())
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  return path
}

export function navigate(to) {
  history.pushState(null, '', BASE + to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function Link({ to, children, ...rest }) {
  return (
    <a
      href={BASE + to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
