import { useEffect, useRef } from 'react'
import { marked } from 'marked'
import { posts, getPost } from './posts'
import { Link } from './router'
import './blog.css'

const stamp = (d) => d.slice(2).replaceAll('-', '.') // 2026-08-16 → 26.08.16
const seq = (i) => String(posts.length - i).padStart(3, '0')

function useTitle(title) {
  useEffect(() => {
    document.title = title
  }, [title])
}

// ```mermaid / ```excalidraw 코드 펜스를 렌더된 다이어그램으로 치환 (lazy import — 글에 없으면 0KB)
function useDiagrams(ref, slug) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    let dead = false

    const mmd = root.querySelectorAll('code.language-mermaid')
    if (mmd.length) {
      import('mermaid').then(({ default: mermaid }) => {
        if (dead) return
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          themeVariables: { fontFamily: 'Pretendard, sans-serif' },
        })
        mmd.forEach(async (code, i) => {
          try {
            const { svg } = await mermaid.render(`mmd-${slug}-${i}`, code.textContent)
            if (dead) return
            const fig = document.createElement('div')
            fig.className = 'diagram'
            fig.innerHTML = svg
            code.closest('pre').replaceWith(fig)
          } catch {
            /* 렌더 실패 시 코드블록 그대로 노출 */
          }
        })
      })
    }

    const exc = root.querySelectorAll('code.language-excalidraw')
    if (exc.length) {
      import('@excalidraw/utils').then(({ exportToSvg }) => {
        if (dead) return
        exc.forEach(async (code) => {
          try {
            const scene = JSON.parse(code.textContent)
            const svg = await exportToSvg({ ...scene, appState: { ...scene.appState, exportBackground: false } })
            if (dead) return
            svg.style.maxWidth = '100%'
            svg.style.height = 'auto'
            const fig = document.createElement('div')
            fig.className = 'diagram'
            fig.appendChild(svg)
            code.closest('pre').replaceWith(fig)
          } catch {
            /* 렌더 실패 시 코드블록 그대로 노출 */
          }
        })
      })
    }

    // 코드 하이라이트 + 복사 버튼 (mermaid/excalidraw 펜스 제외)
    const codes = [...root.querySelectorAll('pre > code')].filter(
      (c) => !/language-(mermaid|excalidraw)/.test(c.className),
    )
    if (codes.length) {
      import('highlight.js').then(({ default: hljs }) => {
        if (dead) return
        codes.forEach((code) => {
          hljs.highlightElement(code)
          const pre = code.closest('pre')
          if (pre.querySelector('.copy')) return
          const btn = document.createElement('button')
          btn.className = 'copy'
          btn.type = 'button'
          btn.textContent = 'COPY'
          btn.onclick = () => {
            navigator.clipboard.writeText(code.textContent).then(() => {
              btn.textContent = 'COPIED'
              btn.classList.add('ok')
              setTimeout(() => {
                btn.textContent = 'COPY'
                btn.classList.remove('ok')
              }, 1400)
            })
          }
          pre.appendChild(btn)
        })
      })
    }

    return () => {
      dead = true
    }
  }, [ref, slug])
}

export function BlogList() {
  useTitle('Index. — 김종환의 작업 색인')

  return (
    <div className="ix-root">
      <div className="ix-wrap">
        <header className="ix-head">
          <div className="ix-head-row">
            <h1 className="ix-h1">
              Index<span className="fin">.</span>
            </h1>
            <span className="ix-sub">김종환의 작업 색인</span>
          </div>
          <div className="ix-meta">
            <span>
              TOTAL <b>{String(posts.length).padStart(3, '0')}</b>
            </span>
            {posts[0] && (
              <span>
                LAST <b>{posts[0].date}</b>
              </span>
            )}
            <span>
              FIELD <b>BACKEND / MSA</b>
            </span>
          </div>
        </header>

        <div className="ix">
          <div className="ix-cols" aria-hidden="true">
            <span>NO</span>
            <span>DATE</span>
            <span>TITLE</span>
            <span>TAGS</span>
          </div>

          {posts.length === 0 && <p className="ix-empty">NO ENTRIES YET</p>}
          {posts.map((p, i) => (
            <Link to={`/blog/${p.slug}`} className="ix-row" key={p.slug}>
              <span className="ix-no">{seq(i)}</span>
              <span className="ix-dt">{stamp(p.date)}</span>
              <span className="ix-ti">
                {p.title}
                {p.summary && <small>{p.summary}</small>}
              </span>
              <span className="ix-tg">
                {p.tags.map((t) => (
                  <span key={t}>
                    {t}
                    <br />
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>

        <p className="ix-stamp">
          <span>© JONGHWAN KIM</span>
          <span>
            <a href="https://github.com/JongDeug" target="_blank" rel="noreferrer">
              GITHUB.COM/JONGDEUG
            </a>
            {' · '}
            {/* 이력서 — 아는 사람만 들어오는 숨김 링크 */}
            <Link to="/resume">CV</Link>
          </span>
        </p>
      </div>
    </div>
  )
}

export function BlogPost({ slug }) {
  const i = posts.findIndex((p) => p.slug === slug)
  const post = getPost(slug)
  const next = i >= 0 ? posts[i + 1] : undefined // 시간상 이전 글
  const proseRef = useRef(null)
  useDiagrams(proseRef, slug)
  useTitle(post ? `${post.title} — 김종환` : 'NOT FOUND')

  if (!post) {
    return (
      <div className="ix-root">
        <div className="px-wrap">
          <div className="px-bar">
            <Link to="/">← INDEX</Link>
            <span>ERR</span>
          </div>
          <div className="nf">
            <p className="nf-code">404</p>
            <p className="nf-msg">NO SUCH ENTRY IN THE INDEX</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ix-root">
      <div className="px-wrap">
        <div className="px-bar">
          <Link to="/">← INDEX</Link>
          <span>
            NO. {seq(i)} / {String(posts.length).padStart(3, '0')}
          </span>
        </div>

        <header className="px-head">
          <h1 className="px-h1">{post.title}</h1>
          <div className="px-meta">
            <span>
              DATE <b>{post.date}</b>
            </span>
            <span>
              READ <b>{post.minutes} MIN</b>
            </span>
            {post.tags.length > 0 && (
              <span>
                TAGS <b>{post.tags.join(' / ')}</b>
              </span>
            )}
          </div>
        </header>

        <div className="px-body">
          {/* 본인이 쓴 마크다운만 렌더 — 외부 입력 없음 */}
          <div className="prose" ref={proseRef} dangerouslySetInnerHTML={{ __html: marked.parse(post.body) }} />
        </div>

        <footer className="px-foot">
          {next && (
            <Link to={`/blog/${next.slug}`} className="px-next">
              <span className="lab">PREV — NO. {seq(i + 1)}</span>
              <p className="t">{next.title}</p>
            </Link>
          )}
          <Link to="/" className="px-back">
            ← BACK TO INDEX
          </Link>
        </footer>
      </div>
    </div>
  )
}
