// SNS 게이트웨이 — 이력서 본문 인라인용 컴팩트 배너 (7채널, 하단 캡션 없음)
const fs = require('fs')
const path = require('path')
const { Resvg } = require('@resvg/resvg-js')
const { badge } = require('./_icons.cjs')

const C = {
  ink: '#1a1a1e', strong: '#0b0b0f', muted: '#6b6b76',
  line: '#e6e6ea', accent: '#2f57d8', chipBg: '#f2f3f7', chipInk: '#4a4a55',
  accentSoft: '#eef2fd', accentLine: '#c9d6f7',
}
const F = `-apple-system, 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif`
const W = 880, H = 300
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
let s = ''

s += `<defs>
<marker id="arw" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 Z" fill="${C.accent}"/></marker>
</defs>`
s += `<rect width="${W}" height="${H}" rx="14" fill="#ffffff" stroke="${C.line}" stroke-width="1.5"/>`

// ── Zone A: 채널 7종 세로 리스트 ──
s += `<text x="24" y="34" font-family="${F}" font-size="11" font-weight="700" fill="${C.accent}" letter-spacing="0.8">SNS 채널 · 7종</text>`
const channels = ['kakao', 'instagram', 'facebook', 'whatsapp', 'wechat', 'naver', 'line']
const CHLABEL = { kakao: '카카오톡', instagram: '인스타그램', facebook: '페이스북', whatsapp: '왓츠앱', wechat: '위챗', naver: '네이버톡톡', line: '라인' }
const listX = 30, rowTop = 52, rowH = 30, badgeCx = listX + 13
const funnelX = 250, funnelY = 150
channels.forEach((key, i) => {
  const cy = rowTop + i * rowH + rowH / 2
  s += badge(badgeCx, cy, 11, key)
  s += `<text x="${badgeCx + 20}" y="${cy + 4}" font-family="${F}" font-size="11.5" font-weight="600" fill="${C.ink}">${esc(CHLABEL[key])}</text>`
  // webhook 수렴 곡선
  const sx = 196
  s += `<path d="M${sx},${cy} C ${sx + 22},${cy} ${funnelX - 30},${funnelY} ${funnelX - 6},${funnelY}" fill="none" stroke="${C.accent}" stroke-width="1.3" opacity="0.4" marker-end="url(#arw)"/>`
})

// ── Zone B: 게이트웨이 ──
const gx = 250, gw = 330, gy = 40, gh = 220
s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="14" fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="1.8"/>`
s += `<text x="${gx + gw / 2}" y="${gy + 28}" font-family="${F}" font-size="14" font-weight="800" fill="${C.accent}" text-anchor="middle">Integration Gateway</text>`
s += `<text x="${gx + gw / 2}" y="${gy + 45}" font-family="${F}" font-size="10" fill="${C.muted}" text-anchor="middle">NestJS · TypeScript</text>`
const steps = [
  { n: '01', t: 'Webhook 수집' },
  { n: '02', t: '표준 이벤트 정규화 · 공통 DTO' },
  { n: '03', t: '팩토리 패턴 · 무수정 확장 (OCP)' },
]
const stX = gx + 18, stW = gw - 36, stH = 40, stStart = gy + 58, stGap = 10
steps.forEach((st, i) => {
  const y = stStart + i * (stH + stGap)
  s += `<rect x="${stX}" y="${y}" width="${stW}" height="${stH}" rx="9" fill="#fff" stroke="${C.accentLine}" stroke-width="1.2"/>`
  s += `<circle cx="${stX + 22}" cy="${y + stH / 2}" r="13" fill="${C.accent}"/>`
  s += `<text x="${stX + 22}" y="${y + stH / 2 + 4}" font-family="${F}" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">${st.n}</text>`
  s += `<text x="${stX + 44}" y="${y + stH / 2 + 4.5}" font-family="${F}" font-size="12" font-weight="700" fill="${C.strong}">${esc(st.t)}</text>`
})

// NATS 화살표
const nx1 = gx + gw, nx2 = 650
s += `<line x1="${nx1 + 2}" y1="150" x2="${nx2 - 4}" y2="150" stroke="${C.accent}" stroke-width="2" marker-end="url(#arw)"/>`
s += `<rect x="${(nx1 + nx2) / 2 - 28}" y="139" width="56" height="21" rx="10.5" fill="${C.accent}"/>`
s += `<text x="${(nx1 + nx2) / 2}" y="154" font-family="${F}" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">NATS</text>`

// ── Zone C: 통합 인박스 ──
const mx = 650, mw = 204, my = 40, mh = 220
s += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="14" fill="#fff" stroke="${C.line}" stroke-width="1.5"/>`
s += `<text x="${mx + 16}" y="${my + 28}" font-family="${F}" font-size="13" font-weight="800" fill="${C.strong}">통합 인박스</text>`
s += `<text x="${mx + 16}" y="${my + 44}" font-family="${F}" font-size="9.5" fill="${C.muted}">상담사 1명 · 전 채널 응대</text>`
const inbox = [
  { key: 'kakao', name: '예약 문의' },
  { key: 'instagram', name: 'Insta DM' },
  { key: 'line', name: 'LINE 상담' },
]
const rowStart = my + 58, irowH = 42, rowGap = 8
inbox.forEach((m, i) => {
  const y = rowStart + i * (irowH + rowGap)
  const cy = y + irowH / 2
  s += `<rect x="${mx + 14}" y="${y}" width="${mw - 28}" height="${irowH}" rx="9" fill="#fafbfd" stroke="${C.line}" stroke-width="1"/>`
  s += badge(mx + 36, cy, 12, m.key)
  s += `<text x="${mx + 56}" y="${cy + 4}" font-family="${F}" font-size="11.5" font-weight="600" fill="${C.ink}">${esc(m.name)}</text>`
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`
const outDir = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(outDir, 'sns-gateway-compact.svg'), svg)
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W * 2 }, font: { loadSystemFonts: true } }).render().asPng()
fs.writeFileSync(path.join(outDir, 'sns-gateway-compact.png'), png)
console.log('wrote compact', (png.length / 1024).toFixed(0) + 'KB')
