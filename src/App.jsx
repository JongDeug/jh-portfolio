import { useEffect } from 'react'
import resume from './data/resume'
import { resolveIcon } from './data/skillIcons'

// 스크롤 진입 시 섹션이 부드럽게 등장
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Bullets({ items }) {
  return (
    <ul className="bul">
      {items.map((it, i) => (
        <li key={i}>
          {it.k && <b className="lab">{it.k}</b>}
          {it.k && ' — '}
          <span className={it.italic ? 'em' : undefined}>{it.v}</span>
          {it.sub && (
            <ul className="bul sub">
              {it.sub.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function Section({ id, ko, en, children }) {
  return (
    <section className="section reveal" id={id}>
      <h2 className="sec-title">
        <span className="ko">{ko}</span>
        <span className="en">{en}</span>
      </h2>
      {children}
    </section>
  )
}

export default function App() {
  useReveal()
  const r = resume

  return (
    <div className="page">
      <article className="doc">
        {/* ── 헤더 ── */}
        <header className="head reveal in">
          <h1 className="name">{r.name}</h1>
          <p className="role">
            <b>{r.role}</b> · {r.summary}
          </p>
          <blockquote className="quote">
            <span className="fire">🔥</span> {r.quote}
          </blockquote>
          <p className="contacts">
            {r.contacts.map((c, i) => (
              <span key={i} className="contact">
                {c.icon && <span className="cico">{c.icon}</span>}
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    {c.label}
                  </a>
                ) : (
                  <span>{c.label}</span>
                )}
              </span>
            ))}
          </p>
        </header>

        {/* ── 소개 ── */}
        <Section id="about" ko="소개" en="ABOUT ME">
          {r.about.map((b, i) => (
            <div className="about-block" key={i}>
              <h3 className="sub-title">{b.title}</h3>
              {b.sub && <p className="muted-italic">{b.sub}</p>}
              <Bullets items={b.items} />
            </div>
          ))}
        </Section>

        {/* ── 스킬 ── */}
        <Section id="skills" ko="스킬" en="SKILLS">
          <div className="skills-grid">
            {r.skills.map((s, i) => (
              <div className="skill-row" key={i}>
                <div className="skill-cat">{s.k}</div>
                <div className="skill-chips">
                  {s.items.map((name, j) => {
                    const ic = resolveIcon(name)
                    return (
                      <span className="skill-chip" key={j}>
                        {ic && (
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                            <path d={ic.path} fill={`#${ic.hex}`} />
                          </svg>
                        )}
                        {name}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 프로젝트 ── */}
        <Section id="projects" ko="프로젝트" en="PROJECTS">
          <p className="proj-note">{r.projectsNote}</p>
          {r.projects.map((p, i) => (
            <div className="pk reveal" key={i}>
              <h3 className="proj-title">
                {p.title}
                {p.badge && <em className="badge">{p.badge}</em>}
              </h3>
              <p className="stack">
                {p.stack.map((t, j) => {
                  const ic = resolveIcon(t)
                  return (
                    <code className="chip" key={j}>
                      {ic && (
                        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                          <path d={ic.path} fill={`#${ic.hex}`} />
                        </svg>
                      )}
                      {t}
                    </code>
                  )
                })}
              </p>
              {p.figure && (
                <figure className="proj-figure">
                  <img src={p.figure} alt={p.figureAlt || p.title} loading="lazy" />
                </figure>
              )}
              <Bullets items={p.items} />
            </div>
          ))}
        </Section>

        {/* ── 학력 · 자격 ── */}
        <Section id="education" ko="학력 · 자격" en="EDUCATION">
          {r.education.map((e, i) => (
            <p className="edu" key={i}>
              <b>{e.school}</b> <span className="edu-period">· {e.period}</span> {e.desc}
            </p>
          ))}
          <h3 className="sub-title certs-title">자격증</h3>
          <ul className="bul certs">
            {r.certs.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>

        {/* ── 자기소개서 ── */}
        <Section id="cover" ko="자기소개서" en="COVER LETTER">
          <h3 className="sub-title">{r.cover.title}</h3>
          {r.cover.paragraphs.map((p, i) => (
            <p className="cover-p" key={i}>
              {p.strong && <b className="cover-strong">{p.strong}</b>}
              {p.strong && ' '}
              {p.text}
            </p>
          ))}
        </Section>

        <footer className="foot">
          <span>© {r.name}</span>
          <span className="foot-dot">·</span>
          <a href="https://github.com/JongDeug" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </article>
    </div>
  )
}
