// YAML 전체가 아니라 key: value / [a, b] 만 — 옵시디언 frontmatter는 이걸로 충분
// ponytail: 중첩 객체·여러 줄 값은 미지원. 필요해지면 그때 yaml 파서로 교체.
const unquote = (s) => s.trim().replace(/^["']|["']$/g, '')

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { meta: {}, body: raw }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i < 0) continue
    const val = line.slice(i + 1).trim()
    meta[line.slice(0, i).trim()] =
      val.startsWith('[') && val.endsWith(']')
        ? val.slice(1, -1).split(',').map(unquote).filter(Boolean)
        : unquote(val)
  }
  return { meta, body: raw.slice(m[0].length) }
}
