// 브랜드 채널 아이콘 헬퍼 (Simple Icons 공식 SVG path)
const si = require('simple-icons')

// 배지 배경색은 브랜드 아이덴티티에 맞춘 값(카카오만 로고가 어두워 노랑 배경)
const CH = {
  kakao:     { label: '카카오톡',   bg: '#FEE500', ic: '#191919', path: si.siKakaotalk.path },
  instagram: { label: '인스타그램', bg: '#E4405F', ic: '#ffffff', path: si.siInstagram.path },
  facebook:  { label: '페이스북',   bg: '#0866FF', ic: '#ffffff', path: si.siFacebook.path },
  whatsapp:  { label: '왓츠앱',     bg: '#25D366', ic: '#ffffff', path: si.siWhatsapp.path },
  wechat:    { label: '위챗',       bg: '#07C160', ic: '#ffffff', path: si.siWechat.path },
  naver:     { label: '네이버톡톡', bg: '#03C75A', ic: '#ffffff', path: si.siNaver.path },
  line:      { label: '라인',       bg: '#06C755', ic: '#ffffff', path: si.siLine.path },
}

// 원형 배지 + 중앙 정렬된 브랜드 로고
// ratio: 로고 폭 / 배지 반지름 (기본 1.15)
function badge(cx, cy, r, key, ratio = 1.15) {
  const c = CH[key]
  const d = r * ratio
  const scale = d / 24
  const tx = cx - d / 2
  const ty = cy - d / 2
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.bg}"/>` +
    `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">` +
    `<path d="${c.path}" fill="${c.ic}"/></g>`
  )
}

module.exports = { CH, badge }
