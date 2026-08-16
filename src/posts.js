import { parseFrontmatter } from './frontmatter'

// 글은 src/posts/*.md — 옵시디언에서 복사해 넣으면 끝
const files = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true })

// 한글 기준 분당 500자 — 대략치면 충분
const readingTime = (body) => Math.max(1, Math.round(body.replace(/\s/g, '').length / 500))

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw)
    return {
      slug: meta.slug || path.match(/([^/]+)\.md$/)[1],
      title: meta.title || '제목 없음',
      date: meta.date || '',
      summary: meta.summary || '',
      tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
      draft: meta.draft === 'true' || meta.draft === true,
      minutes: readingTime(body),
      body,
    }
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date))

export const getPost = (slug) => posts.find((p) => p.slug === slug)
