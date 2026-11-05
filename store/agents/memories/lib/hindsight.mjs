/** Read-only Hindsight source. Explicit banks only; no discovery of private banks or copied notes. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FACTS = 50
const PAGES = 100
const MAX_BYTES = 2 * 1024 * 1024
let cached = null

export async function readHindsight({ home, memory, fetch: get = globalThis.fetch, now = Date.now() }) {
  let config
  try { config = JSON.parse(readFileSync(join(memory, 'hindsight.json'), 'utf8')) }
  catch (error) {
    if (error.code === 'ENOENT') return { memories: [], agents: [], problems: [] }
    return { memories: [], agents: [], problems: [{ agent: 'hindsight', error: 'Hindsight settings could not be read.' }] }
  }
  const empty = { memories: [], agents: [], problems: [] }
  try {
    if (!Array.isArray(config.banks) || !config.banks.length) return empty
    if (config.banks.length > 64 || config.banks.some(bank => typeof bank !== 'string' || !bank || bank.length > 240 || /records/i.test(bank))) {
      throw new Error('Hindsight needs at most 64 explicit banks; held Records banks cannot be displayed.')
    }
    const native = JSON.parse(readFileSync(join(home, '.hindsight', 'coding-agent.json'), 'utf8'))
    const base = new URL(native.apiUrl)
    if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
      throw new Error('Hindsight must use its local HTTP endpoint.')
    }
    const key = JSON.stringify([home, memory, base.href, config.banks])
    if (cached?.key === key && now - cached.at < 60_000) return cached.promise
    const promise = load(base, [...new Set(config.banks)], native.apiKey, get)
    cached = { key, at: now, promise }
    return await promise
  } catch (error) {
    const message = ['Hindsight must use its local HTTP endpoint.', 'Hindsight needs at most 64 explicit banks; held Records banks cannot be displayed.'].includes(error.message) ? error.message : 'Hindsight configuration could not be read.'
    return { ...empty, problems: [{ agent: 'hindsight', error: message }] }
  }
}

async function load(base, banks, apiKey, get) {
  const memories = [], problems = []
  let next = 0, bytes = 0, limited = false
  const request = async path => {
    const response = await get(new URL(path, base), {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data.items)) throw new Error('Unexpected Hindsight response')
    return data
  }
  await Promise.all(Array.from({ length: Math.min(4, banks.length) }, async () => {
    while (next < banks.length) {
      const bank = banks[next++]
      const root = `/v1/default/banks/${encodeURIComponent(bank)}`
      for (const [endpoint, kind] of [[`memories/list?limit=${FACTS}`, 'note'], [`mental-models?detail=content&limit=${PAGES}`, 'summary']]) {
        try {
          const data = await request(`${root}/${endpoint}`)
          if (data.total > data.items.length) limited = true
          for (const item of data.items) {
            const original = kind === 'note' ? item.text : item.content
            if (typeof item.id !== 'string' || typeof original !== 'string' || !original.trim()) continue
            const body = original.length > 16000 ? original.slice(0, 16000) + '\n[Preview shortened; open Hindsight for the full record.]' : original
            const row = {
              id: `hindsight:${bank}:${kind}:${item.id}`, agent: 'hindsight', kind,
              type: kind === 'note' ? `memory · ${item.fact_type || 'fact'}` : 'knowledge page',
              scope: 'project', project: { name: bank.replace(/^coding-agent::/, ''), path: null },
              title: String(item.name || original.split('\n').find(line => line.trim()) || item.id).slice(0, 200),
              description: `Hindsight · ${bank}`, body,
              path: `Hindsight / ${bank} / ${item.id}`,
              modified: Date.parse(item.last_refreshed_at || item.date || item.created_at) || null,
              size: Buffer.byteLength(body),
            }
            const size = Buffer.byteLength(JSON.stringify(row))
            if (bytes + size > MAX_BYTES) { limited = true; continue }
            bytes += size
            memories.push(row)
          }
        } catch (error) {
          // Never include response bodies or credentials in viewer diagnostics.
          problems.push({ agent: 'hindsight', error: `${bank}: ${error.message === 'Unexpected Hindsight response' ? error.message : /^HTTP \d+$/.test(error.message) ? error.message : 'Hindsight could not be reached'}.` })
        }
      }
    }
  }))
  if (limited) problems.push({ agent: 'hindsight', error: `Hindsight preview: up to ${FACTS} recent memories and ${PAGES} knowledge pages per selected bank, within 2 MB. Search covers the loaded preview; use Hindsight for the full archive.` })
  return {
    memories, problems,
    agents: [{ id: 'hindsight', name: 'Hindsight', color: '#8b9db8', present: true, home: null,
      memory: 'on', where: base.origin, says: 'Read-only memories and knowledge pages from selected Hindsight banks.',
      memories: memories.length, instructions: 0, unreadable: 0, sessions: 0 }],
  }
}
