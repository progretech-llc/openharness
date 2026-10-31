/** Disposable daemon, homes and fake Codex only: no account, model or telemetry receiver. */
import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, it, onTestFailed } from 'vitest'
import { LocalClient } from './harness/client.js'
import { IsolatedDaemon, until } from './harness/daemon.js'

let daemon: IsolatedDaemon | undefined
afterEach(async () => { await daemon?.close(); daemon = undefined })

it('validates before project creation, then observes only the opted-in new Codex process', async () => {
  const d = await IsolatedDaemon.create()
  daemon = d
  // This host uses a group-writable umask; keep the disposable state private as production requires.
  chmodSync(d.dataDir, 0o700)
  onTestFailed(() => console.log(d.log().split('\n').slice(-80).join('\n')))
  await d.start()
  const client = await LocalClient.connect(d)
  const source = JSON.stringify({ kind: 'factory-native-progress-v1', run_id: 'cohort-e2e',
    otlp_http_endpoint: 'http://127.0.0.1:11530/v1/logs', protocol: 'json', log_user_prompt: false, lifetime_seconds: 600 })
  const argvFile = join(d.root, 'launch-argv')
  const launches = (): Array<{ engine: string; args: string[] }> => existsSync(argvFile)
    ? readFileSync(argvFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : []
  try {
    const invalid = await client.request('agent_create', { engine: 'codex', projectSource: 'new', projectName: 'invalid-observation',
      creationId: 'invalid-observation-0001', codexObservation: source.replace('11530', '11531') })
    expect(invalid).toMatchObject({ error: 'INVALID_CODEX_OBSERVATION' })
    expect(existsSync(join(d.env.HOME!, 'harnesses', 'invalid-observation'))).toBe(false)
    expect(launches()).toEqual([])

    for (const observed of [true, false]) {
      const creationId = `observation-e2e-${observed}-0001`
      let created = await client.request('agent_create', { engine: 'codex', creationId, projectSource: 'new',
        projectName: `observation-${observed}`, bypassPermission: false, permissionMode: 'ask',
        prompt: observed ? 'PRIVATE_FIRST_PROMPT_CANARY' : 'DEFAULT_PROMPT',
        ...(observed ? { codexObservation: source } : {}) }, 90_000)
      if (created.state === 'pending') created = await until('the saved creation to resolve', async () => {
        const status = await client.request('agent_create_status', { creationId }, 30_000)
        return status.state === 'pending' ? null : status
      }, 60_000, 250)
      expect(created).toMatchObject({ state: 'created', agent: { engine: 'codex' } })
      const args = await until('the fake native process to receive its actual argv', async () => {
        const rows = launches().filter(row => row.engine === 'codex')
        return rows.length >= (observed ? 1 : 2) ? rows.at(-1)!.args : null
      }, 45_000, 100)
      expect(args).toContain('--no-daemon')
      expect(args).not.toContain('--dangerously-bypass-approvals-and-sandbox')
      if (observed) {
        expect(args).toContain('otel.log_user_prompt=false')
        expect(args).toContain(`otel.environment="factory-soak-cohort-e2e-${creationId}"`)
        const journal = d.log().split('\n').find(line => line.includes('[agent] codex observation ·'))!
        expect(journal).toContain(`"agentId":"${created.agent.id}"`)
        expect(journal).toContain(`"creationId":"${creationId}"`)
        expect(journal).not.toContain('PRIVATE_FIRST_PROMPT_CANARY')
      } else expect(args.some(arg => arg.startsWith('otel.'))).toBe(false)
    }
    expect(d.coresStarted()).toBe(1)
  } finally { client.close() }
})
