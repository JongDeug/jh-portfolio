import Resume from './Resume'
import { BlogList, BlogPost } from './Blog'
import { usePath } from './router'

export default function App() {
  const path = usePath()

  // 이력서 — 홈에서 밀어낸 숨김 경로 (푸터 CV 링크로만 진입)
  if (path === '/resume' || path === '/resume/') return <Resume />

  const m = path.match(/^\/blog\/(.+?)\/?$/)
  if (m) return <BlogPost slug={decodeURIComponent(m[1])} />

  // 그 외 전부(구 /blog 포함) 색인이 홈
  return <BlogList />
}
