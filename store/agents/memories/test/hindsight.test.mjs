import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readHindsight } from '../lib/hindsight.mjs'

function fixture(t, banks = ['coding-agent::example'], apiUrl = 'http://127.0.0.1:8888') {
  const home = mkdtempSync(join(tmpdir(), 'mem-hindsight-')), memory = join(home, 'memory')
  t.after(() => rmSync(home, { recursive: true, force: true }))
  mkdirSync(memory); mkdirSync(join(home, '.hindsight'))
  writeFileSync(join(memory, 'hindsight.json'), JSON.stringify({ banks }))
  writeFileSync(join(home, '.hindsight/coding-agent.json'), JSON.stringify({ apiUrl }))
  return { home, memory }
}

test('reads explicit banks with GET, provenance, limits and caching', async t => {
  const f = fixture(t), calls = []
  const fetch = async (url, options) => {
    if (String(url).includes('mental-models')) assert.equal(url.searchParams.get('detail'), 'content')
    calls.push(String(url)); assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error')
    assert.ok(String(url).includes('coding-agent%3A%3Aexample'))
    return { ok: true, json: async () => String(url).includes('mental-models')
      ? { items: [{ id: 'kp-1', name: 'Decision', content: '# Decision\nKeep the original.', created_at: '2026-11-04' }], total: 1 }
      : { items: [{ id: 'fact-1', text: 'A remembered fact.', fact_type: 'world', date: '2026-11-03' }], total: 90 } }
  }
  const a = await readHindsight({ ...f, fetch, now: 1000 })
  assert.equal(a.memories.length, 2); assert.equal(a.agents[0].name, 'Hindsight')
  assert.equal(a.memories[0].project.name, 'example'); assert.match(a.memories[0].id, /^hindsight:/)
  assert.equal(a.memories[1].body, '# Decision\nKeep the original.')
  assert.match(a.problems[0].error, /preview/)
  await readHindsight({ ...f, fetch, now: 2000 }); assert.equal(calls.length, 2)
})

test('does not contact unconfigured, held, or remote sources', async t => {
  let calls = 0
  const fetch = () => { calls++; throw new Error('unexpected request') }
  for (const [banks, url] of [[[], 'http://127.0.0.1:8888'], [['factory-records'], 'http://127.0.0.1:8888'], [['test'], 'https://example.com'], [['test'], 'http://name:secret@127.0.0.1:8888']]) {
    const f = fixture(t, banks, url)
    assert.equal((await readHindsight({ ...f, fetch })).memories.length, 0)
  }
  assert.equal(calls, 0)
})

test('errors stay visible without leaking response details', async t => {
  const f = fixture(t)
  const a = await readHindsight({ ...f, fetch: async () => { throw new Error('secret response body') } })
  assert.equal(a.problems.length, 2); assert.doesNotMatch(JSON.stringify(a), /secret response body/)
  const g = fixture(t)
  const b = await readHindsight({ ...g, fetch: async () => ({ ok: true, json: async () => ({ error: 'bad' }) }) })
  assert.match(b.problems[0].error, /Unexpected Hindsight response/)
})
