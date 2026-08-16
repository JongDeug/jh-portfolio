import resume from './data/resume'
import { resolveIcon } from './data/skillIcons'
import { Link } from './router'
import SnsDiagram from './SnsDiagram'
import avatar from './assets/avatar.jpg'
import './blog.css'
import './resume.css'

function Bullets({ items }) {
  return (
    <ul className="cv-ul">
      {items.map((it, i) => (
        <li key={i}>
          {it.k && <b className="lab">{it.k}</b>}
          {it.k && ' — '}
          <span className={it.italic ? 'em' : undefined}>{it.v}</span>
          {it.sub && (
            <ul className="sub">
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

function Chip({ name }) {
  const ic = resolveIcon(name)
  return (
    <span className="cv-chip">
      {ic && (
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path d={ic.path} />
        </svg>
      )}
      {name}
    </span>
  )
}

function Stack({ stack }) {
  return (
    <p className="cv-stack">
      {stack.map((t) => (
        <Chip name={t} key={t} />
      ))}
    </p>
  )
}

function Section({ ko, en, children }) {
  return (
    <section className="cv-sec">
      <div className="cv-sec-bar">
        <span>{en}</span>
        <span>{ko}</span>
      </div>
      <div className="cv-sec-body">{children}</div>
    </section>
  )
}

export default function Resume() {
  const r = resume

  return (
    <div className="ix-root">
      <div className="cv-wrap">
        {/* ── 마스트헤드 ── */}
        <header className="cv-head">
          <div className="cv-head-main">
            <div>
              <div className="cv-head-row">
                <h1 className="cv-name">{r.name}</h1>
                <span className="cv-role">BACKEND DEVELOPER</span>
              </div>
              <blockquote className="cv-quote">{r.quote}</blockquote>
            </div>
            <figure className="cv-photo">
              <div className="ph">
                <img src={avatar} alt={`${r.name} 프로필 사진`} />
              </div>
            </figure>
          </div>
          <p className="cv-contacts">
            {r.contacts.map((c, i) =>
              c.href ? (
                <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {c.label}
                </a>
              ) : (
                <span key={i}>{c.label}</span>
              ),
            )}
          </p>
        </header>

        {/* ── 소개 ── */}
        <Section ko="소개" en="ABOUT">
          {r.about.map((b, i) => (
            <div className="cv-block" key={i}>
              <h3 className="cv-block-title">{b.title}</h3>
              {b.sub && <p className="cv-block-sub">{b.sub}</p>}
              <Bullets items={b.items} />
            </div>
          ))}
        </Section>

        {/* ── 스킬 ── */}
        <section className="cv-sec">
          <div className="cv-sec-bar">
            <span>SKILLS</span>
            <span>스킬</span>
          </div>
          {r.skills.map((s, i) => (
            <div className="cv-skill-row" key={i}>
              <span className="cv-skill-k">{s.k.toUpperCase()}</span>
              <span className="cv-skill-v">
                {s.items.map((name) => (
                  <Chip name={name} key={name} />
                ))}
              </span>
            </div>
          ))}
        </section>

        {/* ── 프로젝트 ── */}
        <Section ko="프로젝트" en="PROJECTS">
          <p className="cv-note">{r.projectsNote}</p>
          {r.projects.map((p, i) => (
            <div className="cv-proj" key={i}>
              <h3 className="cv-proj-title">
                <span className="cv-proj-no">{String(i + 1).padStart(3, '0')}</span>
                {p.title}
                {p.badge && <em className="cv-badge">{p.badge}</em>}
              </h3>
              <Stack stack={p.stack} />
              {p.figure && (
                <figure className="cv-figure">
                  <img src={p.figure} alt={p.figureAlt || p.title} loading="lazy" />
                </figure>
              )}
              <Bullets items={p.items} />
              {p.sub &&
                p.sub.map((sp, k) => (
                  <div className="cv-proj-sub" key={k}>
                    <h4 className="cv-proj-title">
                      <span className="cv-sub-tag">MSA 구성 서비스</span>
                      {sp.title}
                      {sp.badge && <em className="cv-badge">{sp.badge}</em>}
                    </h4>
                    <Stack stack={sp.stack} />
                    {sp.diagram === 'sns' && <SnsDiagram />}
                    {sp.figure && (
                      <figure className="cv-figure">
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
        <Section ko="학력 · 자격" en="EDUCATION">
          {r.education.map((e, i) => (
            <p className="cv-edu" key={i}>
              <b>{e.school}</b> <span className="prd">· {e.period}</span> {e.desc}
            </p>
          ))}
          <div className="cv-certs">
            <p className="cv-certs-title">CERTIFICATES</p>
            <ul className="cv-ul">
              {r.certs.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ── 자기소개서 ── */}
        <Section ko="자기소개서" en="COVER LETTER">
          <span className="cv-cover-title">{r.cover.title}</span>
          {r.cover.paragraphs.map((p, i) => {
            if (p.strong) {
              const m = p.strong.match(/^(\d+)\.\s*(.*)$/)
              return (
                <div key={i}>
                  <p className="cv-cover-h">
                    {m ? (
                      <>
                        <span className="n">{m[1]}.</span> {m[2]}
                      </>
                    ) : (
                      p.strong
                    )}
                  </p>
                  <p className="cv-p">{p.text}</p>
                </div>
              )
            }
            if (p.quote) {
              return (
                <blockquote className="cv-cover-quote" key={i}>
                  {p.text}
                </blockquote>
              )
            }
            return (
              <p className="cv-p" key={i}>
                {p.text}
              </p>
            )
          })}
        </Section>

        <footer className="cv-foot">
          <span>© JONGHWAN KIM</span>
          <span className="cv-print-hide">
            <Link to="/">← BACK TO INDEX</Link>
          </span>
        </footer>
      </div>
    </div>
  )
}
