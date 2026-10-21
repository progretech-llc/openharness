import { describe, expect, it } from 'vitest'
import { homedir } from 'node:os'
import { emptySessionWork, ingestSessionWork, validSessionWork } from './sessionWork.js'
import { publicResourcePath } from './sharedResourceActivity.js'

const path = '/mnt/PT-Storage/Tools & Assets/skills/shared-library/SKILL.md'
const at = new Date().toISOString()
function receipt(name: string, input: unknown, failed = false, engine = 'claude') {
  const state = emptySessionWork()
  const rows = engine === 'claude' ? [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'r', name, input }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'r', content: 'ok', is_error: failed }] } },
  ] : [
    { type: 'response_item', payload: { type: 'custom_tool_call', call_id: 'r', name, input } },
    { type: 'response_item', payload: { type: 'custom_tool_call_output', call_id: 'r', output: JSON.stringify({ exit_code: failed ? 1 : 0, output: 'ok' }) } },
  ]
  for (const row of rows) ingestSessionWork(state, { timestamp: at, ...row }, engine, '/projects')
  expect(validSessionWork(JSON.parse(JSON.stringify(state)))).toBe(true)
  return state.resources ?? []
}
describe('shared resource receipts', () => {
  it('records successful literal reads, with no arguments or output retained', () => {
    expect(receipt('Read', { file_path: path })).toEqual([{ kind: 'read', path, at }])
    expect(receipt('Bash', { command: `cat '${path}'` })).toEqual([{ kind: 'read', path, at }])
    expect(receipt('exec', `text(await tools.exec_command({cmd: "cat '${path}'"}));`, false, 'codex'))
      .toEqual([{ kind: 'read', path, at }])
  })
  it('does not turn failed reads, echo, compound commands or interpolations into access', () => {
    expect(receipt('Read', { file_path: path }, true)).toEqual([])
    for (const command of [`echo '${path}'`, `cat '${path}'; true`, `cat "$FILE"`, `cat '${path}' | head`, `cat --help '${path}'`])
      expect(receipt('Bash', { command })).toEqual([])
  })
  it('records memory service calls without query text or memory contents', () => {
    expect(receipt('mcp__hindsight__hindsight_search_knowledge_pages', { query: 'private example' }))
      .toEqual([{ kind: 'memory', service: 'hindsight', at }])
  })
  it('allows native skill links while rejecting private or escaped paths', () => {
    expect(publicResourcePath(`${homedir()}/.codex/skills/shared-library/SKILL.md`)).toBe(true)
    for (const p of [path + '/../.env', '/mnt/PT-Storage/Tools & Assets/Hermes/profiles/config.yaml',
      '/mnt/PT-Storage/Knowledge-Share/Records/file.txt', '/mnt/PT-Storage/Tools & Assets/tool/secrets.json'])
      expect(publicResourcePath(p)).toBe(false)
  })
})
