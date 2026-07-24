// SNS 통합 연동 게이트웨이 아키텍처 다이어그램 — 상세형(클릭 확대용)
// 이력서 톤 매칭: white doc, ink #1a1a1e, accent #2f57d8, line #e6e6ea
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

const W = 1280, H = 760
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

let s = ''

// 배경 + 도트 그리드
s += `<rect width="${W}" height="${H}" fill="#ffffff"/>`
s += `<defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(0,0,0,0.045)"/></pattern>
<marker id="arw" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L8,4.5 L0,9 Z" fill="${C.accent}"/></marker></defs>`
s += `<rect width="${W}" height="${H}" fill="url(#dots)"/>`

// ── 타이틀 ──
s += `<text x="48" y="62" font-family="${F}" font-size="30" font-weight="800" fill="${C.strong}" letter-spacing="-0.5">SNS 통합 연동 게이트웨이</text>`
s += `<text x="49" y="90" font-family="${F}" font-size="14" font-weight="600" fill="${C.muted}" letter-spacing="1">OMNICHANNEL INTEGRATION GATEWAY · NestJS · TypeScript · NATS</text>`
s += `<line x1="48" y1="112" x2="${W - 48}" y2="112" stroke="${C.line}" stroke-width="1.5"/>`

// ── Zone 라벨 ──
const zoneLabel = (x, t) => `<text x="${x}" y="150" font-family="${F}" font-size="12.5" font-weight="700" fill="${C.accent}" letter-spacing="1.5">${t}</text>`
s += zoneLabel(48, '외부 SNS 채널 · 7종')
s += zoneLabel(468, '중계 게이트웨이')
s += zoneLabel(958, '병원용 메신저')

// ── Zone A: 채널 카드 7종 ──
const channels = [
  { key: 'kakao', name: '카카오톡', tag: '카카오 상담톡' },
  { key: 'instagram', name: '인스타그램', tag: 'Instagram DM' },
  { key: 'facebook', name: '페이스북', tag: 'Facebook 페이지' },
  { key: 'whatsapp', name: '왓츠앱', tag: 'WhatsApp Business' },
  { key: 'wechat', name: '위챗', tag: '微信 공식계정' },
  { key: 'naver', name: '네이버톡톡', tag: '네이버 톡톡' },
  { key: 'line', name: '라인', tag: 'LINE Official' },
]
const cardX = 48, cardW = 250, cardH = 54, gap = 11, startY = 170
const funnelX = 468, funnelY = 369 // 게이트웨이 세로 중앙
channels.forEach((c, i) => {
  const y = startY + i * (cardH + gap)
  const cy = y + cardH / 2
  s += `<rect x="${cardX}" y="${y}" width="${cardW}" height="${cardH}" rx="12" fill="#fff" stroke="${C.line}" stroke-width="1.5"/>`
  s += badge(cardX + 32, cy, 16, c.key)
  s += `<text x="${cardX + 60}" y="${cy - 3}" font-family="${F}" font-size="15" font-weight="700" fill="${C.strong}">${esc(c.name)}</text>`
  s += `<text x="${cardX + 60}" y="${cy + 15}" font-family="${F}" font-size="11.5" fill="${C.muted}">${esc(c.tag)}</text>`
  const sx = cardX + cardW + 6
  s += `<path d="M${sx},${cy} C ${sx + 55},${cy} ${funnelX - 60},${funnelY} ${funnelX - 6},${funnelY}" fill="none" stroke="${C.accent}" stroke-width="1.5" opacity="0.5" marker-end="url(#arw)"/>`
})
s += `<text x="${cardX}" y="${startY + 7 * (cardH + gap) + 10}" font-family="${F}" font-size="11.5" font-style="italic" fill="${C.muted}">각 채널의 공식 API webhook 인입</text>`

// ── Zone B: 게이트웨이 ──
const gx = 468, gw = 430, gy = 168, gh = 402
s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="18" fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="2"/>`
s += `<text x="${gx + gw / 2}" y="${gy + 34}" font-family="${F}" font-size="17" font-weight="800" fill="${C.accent}" text-anchor="middle">Integration Gateway</text>`
s += `<text x="${gx + gw / 2}" y="${gy + 54}" font-family="${F}" font-size="11.5" fill="${C.muted}" text-anchor="middle">webhook 수집 → 정규화 → NATS 전파</text>`

const steps = [
  { n: '01', t: 'Webhook 수집', d: '7개 채널 인입 이벤트 수신' },
  { n: '02', t: '표준 이벤트 정규화', d: '채널별 포맷 → 공통 DTO' },
  { n: '03', t: '팩토리 패턴 (OCP)', d: '기존 코드 무수정 채널 확장' },
]
const stX = gx + 26, stW = gw - 52, stH = 66, stStart = gy + 74, stGap = 18
steps.forEach((st, i) => {
  const y = stStart + i * (stH + stGap)
  s += `<rect x="${stX}" y="${y}" width="${stW}" height="${stH}" rx="11" fill="#fff" stroke="${C.accentLine}" stroke-width="1.4"/>`
  s += `<circle cx="${stX + 32}" cy="${y + stH / 2}" r="19" fill="${C.accent}"/>`
  s += `<text x="${stX + 32}" y="${y + stH / 2 + 5}" font-family="${F}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${st.n}</text>`
  s += `<text x="${stX + 64}" y="${y + 28}" font-family="${F}" font-size="15.5" font-weight="700" fill="${C.strong}">${esc(st.t)}</text>`
  s += `<text x="${stX + 64}" y="${y + 48}" font-family="${F}" font-size="12" fill="${C.muted}">${esc(st.d)}</text>`
  if (i < steps.length - 1) {
    const ay = y + stH + 2
    s += `<line x1="${stX + stW / 2}" y1="${ay}" x2="${stX + stW / 2}" y2="${ay + stGap - 4}" stroke="${C.accent}" stroke-width="1.6" marker-end="url(#arw)"/>`
  }
})
// 채널 인증 태그
s += `<rect x="${gx + 26}" y="${gy + gh - 40}" width="${gw - 52}" height="26" rx="13" fill="#fff" stroke="${C.line}" stroke-width="1.2"/>`
s += `<text x="${gx + gw / 2}" y="${gy + gh - 22}" font-family="${F}" font-size="11.5" font-weight="600" fill="${C.chipInk}" text-anchor="middle">Meta 앱 검수 완료 · OAuth 채널 인증</text>`

// 게이트웨이 → 병원 메신저 (NATS)
const nx1 = gx + gw + 4, nx2 = 950
s += `<line x1="${nx1}" y1="${funnelY}" x2="${nx2 - 6}" y2="${funnelY}" stroke="${C.accent}" stroke-width="2.2" marker-end="url(#arw)"/>`
s += `<rect x="${(nx1 + nx2) / 2 - 34}" y="${funnelY - 20}" width="68" height="24" rx="12" fill="${C.accent}"/>`
s += `<text x="${(nx1 + nx2) / 2}" y="${funnelY - 4}" font-family="${F}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">NATS</text>`

// ── Zone C: 병원 메신저 통합 인박스 ──
const mx = 950, mw = 282, my = 168, mh = 402
s += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="18" fill="#fff" stroke="${C.line}" stroke-width="1.8"/>`
s += `<text x="${mx + 22}" y="${my + 34}" font-family="${F}" font-size="15.5" font-weight="800" fill="${C.strong}">통합 인박스</text>`
s += `<text x="${mx + 22}" y="${my + 54}" font-family="${F}" font-size="11.5" fill="${C.muted}">상담사 1명이 모든 채널을 한 화면에서</text>`
s += `<line x1="${mx + 22}" y1="${my + 68}" x2="${mx + mw - 22}" y2="${my + 68}" stroke="${C.line}" stroke-width="1.2"/>`

const inbox = [
  { key: 'kakao', name: '김OO 환자', msg: '예약 변경 가능할까요?' },
  { key: 'instagram', name: 'Insta DM', msg: '진료시간 문의드려요' },
  { key: 'line', name: 'LINE 상담', msg: '검사 결과 나왔나요?' },
  { key: 'naver', name: '네이버톡톡', msg: '주차 되나요?' },
]
const rowStart = my + 86, rowH = 62, rowGap = 8
inbox.forEach((m, i) => {
  const y = rowStart + i * (rowH + rowGap)
  const cy = y + rowH / 2
  s += `<rect x="${mx + 16}" y="${y}" width="${mw - 32}" height="${rowH}" rx="11" fill="#fafbfd" stroke="${C.line}" stroke-width="1"/>`
  s += badge(mx + 44, cy, 15, m.key)
  s += `<text x="${mx + 68}" y="${cy - 5}" font-family="${F}" font-size="13.5" font-weight="700" fill="${C.strong}">${esc(m.name)}</text>`
  s += `<text x="${mx + 68}" y="${cy + 15}" font-family="${F}" font-size="11.5" fill="${C.muted}">${esc(m.msg)}</text>`
})

// ── 하단 캡션 배너 ──
const bx = 48, bw = W - 96, by = 656, bh = 62
s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="${C.accentSoft}" stroke="${C.accentLine}" stroke-width="1.5"/>`
s += `<text x="${bx + 26}" y="${by + 27}" font-family="${F}" font-size="14.5" font-weight="800" fill="${C.accent}">외부 SaaS(Respond.io) 대신 SNS 통합 게이트웨이 자체 구축</text>`
s += `<text x="${bx + 26}" y="${by + 48}" font-family="${F}" font-size="13" fill="${C.chipInk}">월 최대 약 <tspan font-weight="800" fill="${C.strong}">196만 원</tspan> (2만 MAC 기준) 운영비 절감 · 팩토리 패턴으로 신규 채널을 기존 코드 수정 없이 추가</text>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`
const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'sns-gateway.svg'), svg)
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W * 2 }, font: { loadSystemFonts: true } }).render().asPng()
fs.writeFileSync(path.join(outDir, 'sns-gateway.png'), png)
console.log('wrote detail', (png.length / 1024).toFixed(0) + 'KB')
