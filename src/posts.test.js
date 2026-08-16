// node --test src/posts.test.js — frontmatter 파싱과 /blog 라우트 매칭만 확인
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parseFrontmatter } from './frontmatter.js'

test('frontmatter가 없으면 본문 그대로', () => {
  const { meta, body } = parseFrontmatter('# 제목\n내용')
  assert.deepEqual(meta, {})
  assert.equal(body, '# 제목\n내용')
})

test('제목 · 날짜 · 태그 배열을 읽고 본문에서 블록을 제거한다', () => {
  const { meta, body } = parseFrontmatter('---\ntitle: 안녕\ndate: 2026-08-16\ntags: [a, b]\n---\n본문')
  assert.equal(meta.title, '안녕')
  assert.equal(meta.date, '2026-08-16')
  assert.deepEqual(meta.tags, ['a', 'b'])
  assert.equal(body, '본문')
})

test('본문의 콜론은 frontmatter로 새지 않는다', () => {
  const { meta, body } = parseFrontmatter('---\ntitle: 요약: 부제\n---\nkey: not-meta')
  assert.equal(meta.title, '요약: 부제')
  assert.equal(body, 'key: not-meta')
})

test('실제 posts/*.md 는 title과 date를 모두 갖는다', () => {
  const dir = new URL('./posts/', import.meta.url)
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  assert.ok(files.length > 0, 'posts 디렉터리가 비었다')
  for (const f of files) {
    const { meta } = parseFrontmatter(readFileSync(new URL(f, dir), 'utf8'))
    assert.ok(meta.title, `${f}: title 없음`)
    assert.match(meta.date || '', /^\d{4}-\d{2}-\d{2}$/, `${f}: date 형식 오류`)
  }
})

test('/blog/:slug 라우트 매칭', () => {
  const slug = (p) => p.match(/^\/blog\/(.+?)\/?$/)?.[1]
  assert.equal(slug('/blog/hello-blog'), 'hello-blog')
  assert.equal(slug('/blog/hello-blog/'), 'hello-blog')
  assert.equal(slug('/blog'), undefined)
  assert.equal(slug('/'), undefined)
})
