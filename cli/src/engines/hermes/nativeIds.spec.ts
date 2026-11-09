import { describe, expect, it } from 'vitest'
import { HERMES_HISTORY_ID_RE, HERMES_SOURCE } from './contract.js'

describe('Hermes native local session IDs', () => {
  const id = `local-${'a1'.repeat(32)}`

  it('admits the exported native shape for history and source verification', () => {
    expect(HERMES_HISTORY_ID_RE.test(id)).toBe(true)
    expect(HERMES_SOURCE.id.test(id)).toBe(true)
    expect(HERMES_SOURCE.interactive).not.toContain('subagent')
    expect(HERMES_SOURCE.query).toContain('WHERE id = ?')
  })

  it('rejects truncated, suffixed, nonhex and injection-shaped identities', () => {
    for (const invalid of [id.slice(0, -1), `${id}0`, `${id}\0`, `${id}/child`, `local-${'g'.repeat(64)}`, "local-'; DROP TABLE sessions;--"]) {
      expect(HERMES_HISTORY_ID_RE.test(invalid)).toBe(false)
      expect(HERMES_SOURCE.id.test(invalid)).toBe(false)
    }
  })

  it('keeps editor histories readable without granting interactive source identity', () => {
    const editor = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    expect(HERMES_HISTORY_ID_RE.test(editor)).toBe(true)
    expect(HERMES_SOURCE.id.test(editor)).toBe(false)
    expect(HERMES_SOURCE.id.test('20260921_152236_a1b2c3')).toBe(true)
  })
})
