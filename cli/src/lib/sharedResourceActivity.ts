/** Public resource metadata only. Never retain commands, tool arguments or result contents. */
import { homedir } from 'node:os'
import { resolve } from 'node:path'

export type ResourceUse = { kind: 'read' | 'tool'; path: string } | { kind: 'memory'; service: 'hindsight' | 'knowledge' }
export type ResourceEvent = ResourceUse & { at: string }
const publicRoots = ['/mnt/PT-Storage/Tools & Assets/', '/mnt/PT-Storage/Knowledge-Share/',
  ...['.codex/skills/', '.agents/skills/', '.claude/skills/'].map(p => `${homedir()}/${p}`)]
export function publicResourcePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 4096 || /[\x00-\x1f\x7f]/.test(value)) return false
  const path = resolve(value)
  const root = publicRoots.find(root => path.startsWith(root))
  return path === value && !!root
    && !path.slice(root.length).split('/').some(p => p.startsWith('.') || /^(?:records|private|credentials|secrets|profiles|sessions|history|node_modules|__pycache__|hermes|openclaw|hindsight)$/i.test(p)
      || /credential|secret|password|token|private.key/i.test(p))
    && !/\.(?:db|sqlite|sqlite3|key|pem|pfx|env)$/i.test(path)
    // Native skill discovery roots are the sole permitted hidden parent directories.
}
export function validResourceUse(value: unknown): value is ResourceUse {
  const r = value as ResourceUse | null
  return !!r && (r.kind === 'memory' ? ['hindsight', 'knowledge'].includes(r.service)
    : ['read', 'tool'].includes(r.kind) && publicResourcePath(r.path))
}
export function resourceUses(name: string, args: Record<string, unknown> | null): ResourceUse[] {
  if (/^(?:mcp__hindsight__|mcp__.*__hindsight_)/.test(name)) return [{ kind: 'memory', service: 'hindsight' }]
  if (/^mcp__.*__(?:ragflow_retrieval|ragflow_search)/.test(name)) return [{ kind: 'memory', service: 'knowledge' }]
  const path = args?.file_path ?? args?.path
  return ['Read', 'read_file', 'view_image'].includes(name) && publicResourcePath(path) ? [{ kind: 'read', path }] : []
}
