// 프로젝트 스택 칩 미리보기 (skew 칩 + 로고 역보정, 웹과 동일 로직)
const fs = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')
const si = require('simple-icons')

const C = { ink: '#1a1a1e', strong: '#0b0b0f', muted: '#6b6b76', line: '#e6e6ea', chipBg: '#f2f3f7', chipInk: '#4a4a55' }
const F = `-apple-system, 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif`

const MAP = {
  TypeScript: si.siTypescript, Go: si.siGo, NestJS: si.siNestjs, Express: si.siExpress, Gin: si.siGin,
  NATS: si.siNatsdotio, RabbitMQ: si.siRabbitmq, MySQL: si.siMysql, MariaDB: si.siMariadb, Redis: si.siRedis,
  Prisma: si.siPrisma, TypeORM: si.siTypeorm, HTML: si.siHtml5, CSS: si.siCss, SvelteKit: si.siSvelte,
  React: si.siReact, Docker: si.siDocker, 'Docker-Compose': si.siDocker, Harbor: si.siHarbor, Git: si.siGit,
  'GitHub Actions': si.siGithubactions, Vim: si.siVim, tmux: si.siTmux,
  PM2: si.siPm2, Nginx: si.siNginx, PostgreSQL: si.siPostgresql, 'Node.js': si.siNodedotjs,
}
const ALIASES = [['라즈베리파이', si.siRaspberrypi], ['PostgreSQL', si.siPostgresql], ['Node.js', si.siNodedotjs]]
const resolve = (l) => MAP[l] || (ALIASES.find(([k]) => l.includes(k)) || [])[1] || null

const PROJECTS = [
  { t: '외부 SNS 채널 7종 통합 연동 게이트웨이', s: ['NestJS', 'TypeScript', 'MariaDB', 'Prisma', 'NATS', 'Docker'] },
  { t: '한방 진료 차트(EMR) 서비스 운영·고도화', s: ['Node.js(Koa)', 'TypeScript', 'MariaDB', 'RabbitMQ', 'PM2'] },
  { t: '병원용 메신저 플랫폼', s: ['Go', 'NATS', 'MariaDB', 'Redis', 'KrakenD', 'WebSocket'] },
  { t: '사내 CS 응대', s: ['NestJS', 'TypeScript', 'TypeORM', 'Redis', 'WebSocket', 'Nginx', 'Docker'] },
  { t: 'Chaos — AI를 활용한 세컨 브레인', s: ['라즈베리파이 직접 운영', 'Express', 'PostgreSQL(pgvector)', 'React'] },
]

const W = 820
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const textW = (t) => t.split('').reduce((a, ch) => a + (/[가-힣]/.test(ch) ? 12.5 : /[A-Z]/.test(ch) ? 7.6 : /[a-z0-9]/.test(ch) ? 6.4 : ch === ' ' ? 3.5 : 5.2), 0)

let s = ''
let y = 24
PROJECTS.forEach((p) => {
  s += `<text x="24" y="${y + 14}" font-family="${F}" font-size="14.5" font-weight="800" fill="${C.strong}">${esc(p.t)}</text>`
  y += 28
  let cx = 24
  const chipH = 22
  p.s.forEach((name) => {
    const ic = resolve(name)
    const w = 18 + (ic ? 17 : 0) + textW(name)
    if (cx + w > W - 24) { cx = 24; y += chipH + 8 }
    // skew 그룹
    s += `<g transform="translate(${cx.toFixed(1)} ${y}) skewX(-8)">`
    s += `<rect x="0" y="0" width="${w.toFixed(1)}" height="${chipH}" rx="6" fill="${C.chipBg}"/>`
    let tx = 9
    if (ic) {
      const sc = 12 / 24
      // 그룹이 skewX(-8)이므로 로고는 skewX(8)로 상쇄
      s += `<g transform="translate(9 ${(chipH - 12) / 2}) skewX(8) scale(${sc})"><path d="${ic.path}" fill="#${ic.hex}"/></g>`
      tx = 9 + 12 + 5
    }
    s += `<text x="${tx}" y="${chipH / 2 + 4}" font-family="${F}" font-size="12" font-style="italic" fill="${C.chipInk}">${esc(name)}</text>`
    s += `</g>`
    cx += w + 7
  })
  y += chipH + 22
})

const H = Math.ceil(y)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${s}</svg>`
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W * 2 }, font: { loadSystemFonts: true } }).render().asPng()
fs.writeFileSync(path.join(__dirname, '..', 'public', 'stack-preview.png'), png)
console.log('wrote stack-preview', W + 'x' + H, (png.length / 1024).toFixed(0) + 'KB')
