// node --test src/search.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndex, search } from './search.js'

const docs = [
  { title: 'nginx 프록시 뒤에서 WebSocket', tags: ['nginx'], summary: '', body: '쿠키 secure 설정' },
  { title: '리눅스 패키지 의존성', tags: ['linux'], summary: 'apt가 하는 일', body: 'nginx 설치도 여기서' },
]
const ix = buildIndex(docs)
const rank = (q) => search(ix, q)?.map((h) => h.i)

test('빈 검색어는 null — 검색 안 함', () => {
  assert.equal(search(ix, '   '), null)
})

test('제목 매치가 본문 매치보다 위로 올라온다', () => {
  assert.deepEqual(rank('nginx'), [0, 1])
})

test('여러 단어는 모두 만족해야 통과(AND)', () => {
  assert.deepEqual(rank('nginx 쿠키'), [0])
  assert.deepEqual(rank('nginx 없는말'), [])
})

test('단어가 서로 다른 필드에 흩어져 있어도 통과', () => {
  assert.deepEqual(rank('리눅스 apt'), [1])
})

test('초성만 쳐도 찾는다', () => {
  assert.deepEqual(rank('ㄹㄴㅅ'), [1]) // 리눅스
  assert.deepEqual(rank('ㅍㄹㅅ'), [0]) // 프록시
})

test('초성 검색이 영문 단어를 망가뜨리지 않는다', () => {
  assert.deepEqual(rank('websocket'), [0])
})
