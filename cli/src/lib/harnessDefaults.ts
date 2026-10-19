import type { AgentEngine } from '../engines/types.js'

export const DEFAULT_HARNESS_ENGINE = 'opencode' as const
export const DEFAULT_HARNESS_MODEL = 'ollama/qwen3-coder:30b'
export const DEFAULT_HARNESS_EFFORT = 'xhigh'
export const DEFAULT_HARNESS_PERMISSION = 'auto'

function opencodePermission(config: Record<string, any>, permissionMode: string) {
  return permissionMode === 'ask' ? 'ask'
    : typeof config.permission === 'object' && config.permission !== null
      ? { '*': 'allow', ...config.permission } : 'allow'
}

/** Apply an explicit permission change without replacing the conversation's model or tools. */
export function harnessPermissionEnvironment(engine: AgentEngine, env: Record<string, string>, permissionMode: string): Record<string, string> {
  if (engine !== 'opencode') return env
  const config = JSON.parse(env.OPENCODE_CONFIG_CONTENT || '{}')
  return { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify({ ...config, permission: opencodePermission(config, permissionMode) }) }
}

/**
 * A chosen grid names its model in the file it writes (`OPENCODE_CONFIG`, lib/gridLaunch.ts), and OpenCode
 * lets inline config outrank that file: a package's own model there would run instead of the person's grid.
 */
function withoutPackageModel(env: Record<string, string>): Record<string, string> {
  if (!env.OPENCODE_CONFIG_CONTENT) return env
  const config = JSON.parse(env.OPENCODE_CONFIG_CONTENT)
  if (config.model === undefined && config.small_model === undefined) return env
  delete config.model
  delete config.small_model
  return { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify(config) }
}

/** Fresh own-provider launches only. Restores, explicit model routes and a package's own model keep their choices. */
export function freshHarnessEnvironment(engine: AgentEngine, env: Record<string, string> = {},
  explicitRoute = false, permissionMode = DEFAULT_HARNESS_PERMISSION): Record<string, string> {
  if (engine !== DEFAULT_HARNESS_ENGINE) return env
  if (explicitRoute) return withoutPackageModel(env)
  const config = JSON.parse(env.OPENCODE_CONFIG_CONTENT || '{}')
  // A package that names its own model keeps it. Memories reads a person's whole message history, so it
  // can retain its explicitly chosen model (store/agents/memories/harness.json).
  // Unselected engineering launches use the existing workstation Ollama; never a hosted fallback.
  if (typeof config.model === 'string' && config.model) {
    return { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify({ ...config, permission: opencodePermission(config, permissionMode) }) }
  }
  return { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify({
    ...config,
    permission: opencodePermission(config, permissionMode),
    model: DEFAULT_HARNESS_MODEL,
    small_model: DEFAULT_HARNESS_MODEL,
    provider: { ...config.provider, ollama: {
      ...config.provider?.ollama,
      npm: '@ai-sdk/openai-compatible',
      options: { ...config.provider?.ollama?.options, baseURL: 'http://127.0.0.1:11434/v1' },
      models: { ...config.provider?.ollama?.models,
        'qwen3-coder:30b': { ...config.provider?.ollama?.models?.['qwen3-coder:30b'],
          name: 'Workstation Qwen3 Coder 30B', tool_call: true,
          limit: { context: 65536, output: 8192 } },
      },
    } },
    agent: { ...config.agent,
      build: { ...config.agent?.build, model: DEFAULT_HARNESS_MODEL },
      plan: { ...config.agent?.plan, model: DEFAULT_HARNESS_MODEL },
    },
  }) }
}
