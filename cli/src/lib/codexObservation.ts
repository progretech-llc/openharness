import { createHash } from 'node:crypto'
import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'
import { validCreationId } from './agentCreationReceipt.js'

const MAX_BYTES = 4096
const ENDPOINT = 'http://127.0.0.1:11530/v1/logs'
const KEYS = ['kind', 'run_id', 'otlp_http_endpoint', 'protocol', 'log_user_prompt', 'lifetime_seconds'].sort()

export class CodexObservationError extends Error {}

interface ObservationSpec {
  kind: 'factory-native-progress-v1'
  run_id: string
  otlp_http_endpoint: typeof ENDPOINT
  protocol: 'json'
  log_user_prompt: false
  lifetime_seconds: number
}

export interface CodexObservationInput { source: string; creationId: string }

/** No arbitrary Codex settings cross this boundary, even from a direct wire client. */
export function parseCodexObservation(source: unknown): ObservationSpec {
  if (typeof source !== 'string' || Buffer.byteLength(source) > MAX_BYTES) {
    throw new CodexObservationError('Codex observation must be a JSON spec of at most 4096 bytes.')
  }
  let spec: unknown
  try { spec = JSON.parse(source) }
  catch { throw new CodexObservationError('Codex observation must be valid JSON.') }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)
    || Object.keys(spec).sort().join(',') !== KEYS.join(',')) {
    throw new CodexObservationError('Codex observation has an unsupported shape.')
  }
  const value = spec as Record<string, unknown>
  if (value.kind !== 'factory-native-progress-v1'
    || typeof value.run_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value.run_id)
    || value.otlp_http_endpoint !== ENDPOINT || value.protocol !== 'json' || value.log_user_prompt !== false
    || !Number.isInteger(value.lifetime_seconds) || Number(value.lifetime_seconds) < 1 || Number(value.lifetime_seconds) > 1800) {
    throw new CodexObservationError('Codex observation requires a public run slug, the fixed loopback JSON endpoint, prompt logging off, and lifetime 1–1800 seconds.')
  }
  return value as unknown as ObservationSpec
}

/** Read locally, before asking for admission or creating a project, receipt or pane. */
export function readCodexObservation(path: string): string {
  let fd: number
  try { fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK) }
  catch { throw new CodexObservationError('Cannot read the local Codex observation spec.') }
  try {
    if (!fstatSync(fd).isFile()) throw new CodexObservationError('Codex observation must be a regular local file.')
    const bytes = Buffer.alloc(MAX_BYTES + 1)
    const length = readSync(fd, bytes, 0, bytes.length, 0)
    const source = bytes.subarray(0, length).toString('utf8')
    if (length > MAX_BYTES) throw new CodexObservationError('Codex observation spec is too large.')
    parseCodexObservation(source)
    return source
  } finally { closeSync(fd) }
}

/** Lifetime belongs to the observer; these flags never stop a worker or change its model. */
export function codexObservationLaunch(engine: string, source: unknown, creationId: unknown) {
  if (source === undefined) return undefined
  if (engine !== 'codex' || !validCreationId(creationId)) {
    throw new CodexObservationError('Codex observation is only for a new Codex launch with a creation ID.')
  }
  const spec = parseCodexObservation(source)
  const environment = `factory-soak-${spec.run_id}-${creationId}`
  return {
    runId: spec.run_id, creationId, environment, lifetimeSeconds: spec.lifetime_seconds,
    specSha256: createHash('sha256').update(source as string).digest('hex'),
    extraArgs: ['-c', `otel.environment=${JSON.stringify(environment)}`, '-c', 'otel.log_user_prompt=false',
      '-c', `otel.exporter={otlp-http={endpoint=${JSON.stringify(ENDPOINT)},protocol="json"}}`],
  }
}
