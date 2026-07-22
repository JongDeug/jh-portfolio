// 스킬 섹션 로고칩 미리보기 (웹 컴포넌트와 동일 로고/색/레이아웃 근사)
const fs = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')
const si = require('simple-icons')

const C = { ink: '#1a1a1e', strong: '#0b0b0f', muted: '#6b6b76', line: '#e6e6ea', accent: '#2f57d8' }
const F = `-apple-system, 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif`

const ICON = {
  TypeScript: si.siTypescript, Go: si.siGo, NestJS: si.siNestjs, Express: si.siExpress, Gin: si.siGin,
  NATS: si.siNatsdotio, RabbitMQ: si.siRabbitmq, MySQL: si.siMysql, MariaDB: si.siMariadb, Redis: si.siRedis,
  Prisma: si.siPrisma, TypeORM: si.siTypeorm, HTML: si.siHtml5, CSS: si.siCss, SvelteKit: si.siSvelte,
  React: si.siReact, Docker: si.siDocker, 'Docker-Compose': si.siDocker, Harbor: si.siHarbor, Git: si.siGit,
  'GitHub Actions': si.siGithubactions, Vim: si.siVim, tmux: si.siTmux,
}
const SKILLS = [
  { k: 'Languages', items: ['TypeScript', 'Go'] },
  { k: 'Framework', items: ['NestJS', 'Express', 'Gin'] },
  { k: 'Messaging', items: ['NATS', 'RabbitMQ'] },
  { k: 'DB / ORM', items: ['MySQL', 'MariaDB', 'Redis', 'Prisma', 'TypeORM'] },
  { k: 'Frontend', items: ['HTML', 'CSS', 'SvelteKit', 'React'] },
  { k: 'Tooling / DevOps', items: ['Docker', 'Docker-Compose', 'Harbor', 'Git', 'GitHub Actions', 'Vim', 'tmux'] },
]

const W = 820
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const catX = 24, chipX0 = 180, chipH = 27, chipGapX = 8, rowGapY = 16, lineH = 34
// 문자폭 근사(영문/기호 위주)
const textW = (t) => t.split('').reduce((a, ch) => a + (/[A-Z]/.test(ch) ? 8.2 : /[a-z0-9]/.test(ch) ? 6.9 : ch === ' ' ? 3.5 : 5.5), 0)

let s = ''
let y = 44
// 헤더
s += `<text x="${catX}" y="28" font-family="${F}" font-size="11.5" font-weight="600" letter-spacing="1.5" fill="#b7b7c0">SKILLS</text>`

SKILLS.forEach((row, ri) => {
  const rowTop = y
  // 칩 레이아웃
  let cx = chipX0, cy = y
  const chips = []
  row.items.forEach((name) => {
    const ic = ICON[name]
    const w = 22 + (ic ? 20 : 0) + textW(name)
    if (cx + w > W - 24) { cx = chipX0; cy += lineH }
    chips.push({ name, ic, x: cx, y: cy, w })
    cx += w + chipGapX
  })
  const rowBottom = cy + chipH
  // 카테고리 라벨
  s += `<text x="${catX}" y="${rowTop + 19}" font-family="${F}" font-size="13" font-weight="700" fill="${C.accent}">${esc(row.k)}</text>`
  // 칩
  chips.forEach((c) => {
    s += `<rect x="${c.x}" y="${c.y}" width="${c.w.toFixed(1)}" height="${chipH}" rx="9" fill="#fff" stroke="${C.line}" stroke-width="1.2"/>`
    let tx = c.x + 11
    if (c.ic) {
      const sc = 14 / 24
      s += `<g transform="translate(${(c.x + 11).toFixed(1)} ${(c.y + (chipH - 14) / 2).toFixed(1)}) scale(${sc.toFixed(4)})"><path d="${c.ic.path}" fill="#${c.ic.hex}"/></g>`
      tx = c.x + 11 + 14 + 6
    }
    s += `<text x="${tx.toFixed(1)}" y="${c.y + chipH / 2 + 4.5}" font-family="${F}" font-size="12.5" font-weight="600" fill="${C.ink}">${esc(c.name)}</text>`
  })
  // 구분선
  y = rowBottom + rowGapY
  if (ri < SKILLS.length - 1) s += `<line x1="${catX}" y1="${y - rowGapY / 2}" x2="${W - 24}" y2="${y - rowGapY / 2}" stroke="${C.line}" stroke-width="1"/>`
})

const H = Math.ceil(y + 8)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${s}</svg>`
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W * 2 }, font: { loadSystemFonts: true } }).render().asPng()
fs.writeFileSync(path.join(__dirname, '..', 'public', 'skills-preview.png'), png)
console.log('wrote skills-preview', W + 'x' + H, (png.length / 1024).toFixed(0) + 'KB')
