import resume from './data/resume'
import { resolveIcon } from './data/skillIcons'

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

function StackChips({ stack }) {
  return (
    <p className="stack">
      {stack.map((t, j) => {
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
  )
}

function Section({ id, ko, en, children }) {
  return (
    <section className="section" id={id}>
      <h2 className="sec-title">
        <span className="ko">{ko}</span>
        <span className="en">{en}</span>
      </h2>
      {children}
    </section>
  )
}

export default function App() {
  const r = resume

  return (
    <div className="page">
      <article className="doc">
        {/* ── 헤더 ── */}
        <header className="head">
          <h1 className="name">{r.name}</h1>
          <p className="role">
            <b>{r.role}</b> · {r.summary}
          </p>
          <blockquote className="quote">
            {r.quote}
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
            <div className="pk" key={i}>
              <h3 className="proj-title">
                <span className="proj-num">{String(i + 1).padStart(2, '0')}</span>
                {p.title}
                {p.badge && <em className="badge">{p.badge}</em>}
              </h3>
              <StackChips stack={p.stack} />
              {p.figure && (
                <figure className="proj-figure">
                  <img src={p.figure} alt={p.figureAlt || p.title} loading="lazy" />
                </figure>
              )}
              <Bullets items={p.items} />
              {p.sub &&
                p.sub.map((sp, k) => (
                  <div className="pk-sub" key={k}>
                    <h4 className="proj-title proj-sub-title">
                      <span className="sub-tag">MSA 구성 서비스</span>
                      {sp.title}
                      {sp.badge && <em className="badge">{sp.badge}</em>}
                    </h4>
                    <StackChips stack={sp.stack} />
                    {sp.figure && (
                      <figure className="proj-figure">
                        <img src={sp.figure} alt={sp.figureAlt || sp.title} loading="lazy" />
                      </figure>
                    )}
                    <Bullets items={sp.items} />
                  </div>
                ))}
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
          <span className="cover-badge">{r.cover.title}</span>
          {r.cover.paragraphs.map((p, i) => {
            if (p.strong) {
              const m = p.strong.match(/^(\d+)\.\s*(.*)$/)
              return (
                <div className="cover-item" key={i}>
                  <p className="cover-head">
                    {m ? (
                      <>
                        <span className="cover-num">{m[1]}.</span> {m[2]}
                      </>
                    ) : (
                      p.strong
                    )}
                  </p>
                  <p className="cover-p">{p.text}</p>
                </div>
              )
            }
            if (p.quote) {
              return (
                <blockquote className="cover-quote" key={i}>
                  {p.text}
                </blockquote>
              )
            }
            return (
              <p className="cover-p" key={i}>
                {p.text}
              </p>
            )
          })}
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
