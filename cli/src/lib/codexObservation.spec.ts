import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { codexObservationLaunch, parseCodexObservation, readCodexObservation } from './codexObservation.js'
import { buildEngineCommandArgv } from './engineLaunch.js'

const spec = { kind: 'factory-native-progress-v1', run_id: 'cohort-20261031',
  otlp_http_endpoint: 'http://127.0.0.1:11530/v1/logs', protocol: 'json', log_user_prompt: false, lifetime_seconds: 600 }
const source = JSON.stringify(spec)
const creationId = '01234567-89ab-cdef-0123-456789abcdef'
const root = mkdtempSync(join(tmpdir(), 'codex-observation-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('bounded per-launch Codex observation', () => {
  it('binds exact reviewed bytes to the actual creation ID and fixed native flags', () => {
    const result = codexObservationLaunch('codex', source, creationId)!
    expect(result).toEqual({ runId: spec.run_id, creationId, environment: `factory-soak-${spec.run_id}-${creationId}`,
      lifetimeSeconds: 600, specSha256: createHash('sha256').update(source).digest('hex'),
      extraArgs: ['-c', `otel.environment="factory-soak-${spec.run_id}-${creationId}"`, '-c', 'otel.log_user_prompt=false',
        '-c', 'otel.exporter={otlp-http={endpoint="http://127.0.0.1:11530/v1/logs",protocol="json"}}'] })
    expect(codexObservationLaunch('claude', undefined, undefined)).toBeUndefined()
    expect(codexObservationLaunch('codex', `${source}\n`, creationId)!.specSha256).not.toBe(result.specSha256)
  })

  it.each([null, 1, [], {}, '{', 'x'.repeat(4097)])('rejects malformed input without echoing it: %j', raw => {
    expect(() => parseCodexObservation(raw)).toThrow(/Codex observation/)
  })

  it.each([
    { kind: 'other' }, { run_id: '' }, { run_id: '../secret' }, { run_id: 'x'.repeat(65) },
    { run_id: 'x\n-c model_provider=other' }, { lifetime_seconds: 0 }, { lifetime_seconds: 1801 },
    { lifetime_seconds: 1.5 }, { lifetime_seconds: '600' }, { protocol: 'grpc' }, { log_user_prompt: true },
    { otlp_http_endpoint: 'https://example.com/v1/logs' }, { otlp_http_endpoint: 'http://127.0.0.1:11530/v1/traces' },
    { otlp_http_endpoint: 'http://user:PRIVATE_CANARY@127.0.0.1:11530/v1/logs' },
    { otlp_http_endpoint: 'http://localhost:11530/v1/logs' }, { headers: { Authorization: 'PRIVATE_CANARY' } },
    { extraArgs: ['--dangerously-bypass-approvals-and-sandbox'] }, { environment: 'injected' },
    { codexHome: '/private' }, { model_provider: 'other' }, { auth: 'PRIVATE_CANARY' },
  ])('rejects settings outside the fixed contract: %j', change => {
    try { parseCodexObservation(JSON.stringify({ ...spec, ...change })); expect.fail('must reject') }
    catch (error) { expect(String(error)).not.toContain('PRIVATE_CANARY'); expect(String(error)).toMatch(/Codex observation/) }
  })

  it.each([1, 1800])('accepts the observer lifetime boundary %i without a worker timer', lifetime_seconds => {
    expect(parseCodexObservation(JSON.stringify({ ...spec, lifetime_seconds })).lifetime_seconds).toBe(lifetime_seconds)
  })

  it('requires Codex and an existing valid creation identity', () => {
    for (const [engine, id] of [['claude', creationId], ['codex', 'bad'], ['codex', undefined]]) {
      expect(() => codexObservationLaunch(engine!, source, id)).toThrow(/only for a new Codex launch/)
    }
  })

  it('reads only a bounded regular local file and rejects missing, oversized and symlink input', () => {
    const file = join(root, 'spec.json'); writeFileSync(file, source)
    expect(readCodexObservation(file)).toBe(source)
    expect(() => readCodexObservation(join(root, 'missing'))).toThrow(/Cannot read/)
    expect(() => readCodexObservation(root)).toThrow(/regular local file/)
    writeFileSync(join(root, 'large'), ' '.repeat(4097))
    expect(() => readCodexObservation(join(root, 'large'))).toThrow(/too large/)
    symlinkSync(file, join(root, 'linked'))
    expect(() => readCodexObservation(join(root, 'linked'))).toThrow(/Cannot read/)
    writeFileSync(file, '{')
    expect(() => readCodexObservation(file)).toThrow(/valid JSON/)
  })

  it('adds only the fixed telemetry argv; permission, model and literal prompt boundaries stay intact', () => {
    const options = { permissionMode: 'ask', firstPrompt: 'PRIVATE_TASK_CANARY --model other',
      launchModel: { model: 'gpt-6.1-sol', effort: 'low' } }
    const before = buildEngineCommandArgv('codex', options)
    const extraArgs = codexObservationLaunch('codex', source, creationId)!.extraArgs
    const after = buildEngineCommandArgv('codex', { ...options, extraArgs })
    const start = after.indexOf(extraArgs[1]!) - 1
    expect(after.slice(start, start + extraArgs.length)).toEqual(extraArgs)
    expect([...after.slice(0, start), ...after.slice(start + extraArgs.length)]).toEqual(before)
    expect(after.at(-1)).toBe(options.firstPrompt)
    expect(extraArgs.join(' ')).not.toMatch(/PRIVATE|provider|auth|home|permission|model/)
  })
})
