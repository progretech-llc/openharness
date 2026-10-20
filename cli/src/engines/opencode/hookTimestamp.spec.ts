import { describe, expect, it, vi } from 'vitest'
import { nativePluginSource } from '../kit/nativePlugin.js'
import { OPENCODE_LEGACY_PLUGIN, OPENCODE_TUI_PLUGIN } from './contract.js'

const values = { port: '1234', credential: '"credential-file"', version: '"test"' }
const bare = (source: string) => source.replace('import { readFileSync } from "node:fs"', '')

describe('OpenCode native hook ordering timestamp', () => {
  it('timestamps a legacy session event at the engine before posting', async () => {
    let clock = 1000
    const fetch = vi.fn(async (_url: string, _options: { headers: Record<string, string> }) => ({ ok: true }))
    const source = bare(nativePluginSource(OPENCODE_LEGACY_PLUGIN, values))
      .replace('export const MachineRegister', 'const MachineRegister')
    const register = new Function('readFileSync', 'fetch', 'process', 'Date', source + '\nreturn MachineRegister')(
      () => 'local-token', fetch, { env: { TMUX_PANE: '%1' }, pid: 42 }, { now: () => clock })
    const plugin = await register({ directory: '/project' })
    await plugin.event({ event: { type: 'session.created', properties: { info: { id: 'session-1' } } } })
    expect(fetch.mock.calls[0][1].headers['x-harness-hook-fired-at']).toBe('1000')
    clock = 2000
    await plugin.event({ event: { type: 'session.updated', properties: { info: { id: 'session-1' } } } })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('captures the TUI timestamp before asynchronous session lookup', async () => {
    let clock = 1000
    let resolve!: (value: unknown) => void
    const pending = new Promise(done => { resolve = done })
    const fetch = vi.fn(async (_url: string, _options: { headers: Record<string, string> }) => ({ ok: true }))
    const source = bare(nativePluginSource(OPENCODE_TUI_PLUGIN, values)).replace('export default', 'return')
    const plugin = new Function('readFileSync', 'fetch', 'process', 'Date', 'setInterval', 'clearInterval', source)(
      () => 'local-token', fetch, { env: { TMUX_PANE: '%1' }, pid: 42, cwd: () => '/project' },
      { now: () => clock }, () => ({ unref() {} }), () => {})
    const cleanup = plugin.setup({ ui: { router: { current: () => ({ type: 'session', sessionID: 'session-2' }) } },
      data: { session: { get: () => pending } } })
    clock = 2000
    resolve({ location: { directory: '/project' } })
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch.mock.calls[0][1].headers['x-harness-hook-fired-at']).toBe('1000')
    cleanup()
  })
})
