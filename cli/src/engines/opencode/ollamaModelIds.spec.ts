import { describe, expect, it } from 'vitest'
import { opencodeModelTarget, parseOpencodeModelsOutput } from './runtimeProfile.js'

describe('OpenCode native Ollama model tags', () => {
  it('keeps the exact provider and tagged model from the native catalog', () => {
    expect(opencodeModelTarget('ollama/gpt-oss:20b')).toMatchObject({
      id: 'ollama/gpt-oss:20b', provider: 'ollama', model: 'gpt-oss:20b',
    })
    expect(parseOpencodeModelsOutput('ollama/qwen3.8:27b\nollama/gpt-oss:20b\n').map(x => x.id))
      .toEqual(['ollama/qwen3.8:27b', 'ollama/gpt-oss:20b'])
  })

  it('continues to reject shell syntax, whitespace and an absent provider', () => {
    for (const value of ['gpt-oss:20b', 'ollama/gpt-oss:20b;echo', 'ollama/gpt oss:20b', 'ollama/$(id)']) {
      expect(opencodeModelTarget(value)).toBeNull()
    }
  })
})
