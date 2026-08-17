// 색인 검색 — 라이브러리 없이 세 가지만 챙긴다
//   1) 공백으로 나눈 여러 단어를 모두 만족해야 통과 (AND)
//   2) 어느 필드에서 맞았냐로 점수 → 제목 매치가 본문 매치보다 위
//   3) 초성만 쳐도 찾힘 ("ㄹㅋㅅ" → "리눅스")

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const toCho = (s) => s.replace(/[가-힣]/g, (c) => CHO[((c.charCodeAt(0) - 0xac00) / 588) | 0])
const isCho = (s) => /^[ㄱ-ㅎ]+$/.test(s)

// 필드별 가중치 — 제목에서 맞으면 8점, 본문이면 1점
const FIELDS = [
  ['title', 8],
  ['tags', 5],
  ['summary', 3],
  ['body', 1],
]

export const buildIndex = (posts) =>
  posts.map((p) => {
    const raw = { title: p.title, tags: p.tags.join(' '), summary: p.summary, body: p.body }
    const lower = {}
    const cho = {}
    for (const [k, v] of Object.entries(raw)) {
      lower[k] = (v || '').toLowerCase()
      cho[k] = toCho(lower[k])
    }
    return { lower, cho }
  })

/** 점수 내림차순 [{ i, score }]. 빈 검색어면 null (= 검색 안 함) */
export function search(index, query) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return null

  const hits = []
  // ponytail: 전체 문서 선형 스캔. 글이 수백 편 넘어가면 역색인으로
  index.forEach((doc, i) => {
    let score = 0
    for (const t of tokens) {
      let best = 0
      for (const [f, w] of FIELDS) {
        if ((isCho(t) ? doc.cho[f] : doc.lower[f]).includes(t)) best = Math.max(best, w)
      }
      if (!best) return // 토큰 하나라도 없으면 탈락
      score += best
    }
    hits.push({ i, score })
  })
  // 동점이면 최신순 (posts가 날짜 내림차순이라 i가 작을수록 최신)
  return hits.sort((a, b) => b.score - a.score || a.i - b.i)
}
