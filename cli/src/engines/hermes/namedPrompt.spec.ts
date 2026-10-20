import { describe, expect, it } from 'vitest'
import { screenFor } from '../screens.js'
import { inspectCloseActivity } from '../../lib/closeAgentService.js'

const capture = (input: string) => `Done.\n────────────────────────\nimagen ❯ ${input}\n────────────────────────\n`
const session = { engine: 'hermes' as const, sessionId: 'completed-session', transcriptPath: '/fixture' }

describe('Hermes profile-prefixed composer', () => {
  it('allows idle control only with an empty composer and completed native turn', () => {
    const screen = screenFor('hermes').inspect(capture('\u001b[3m\u001b[38;5;136mExplain this error and how to fix it\u001b[0m'))
    expect(screen.pane).toMatchObject({ idle: true, draft: false })
    expect(screen.teamHold).toBeNull()
    expect(inspectCloseActivity(session, screen, false, false)).toBe('idle')
    expect(inspectCloseActivity(session, screen, true, false)).toBe('working')
    expect(inspectCloseActivity(session, screen, undefined, false)).toBe('unknown')
    expect(inspectCloseActivity(session, screen, false, true)).toBe('needs_input')
  })

  it('preserves typed single-line and multiline drafts', () => {
    for (const input of ['Publish the article', '\nPublish the article']) {
      const screen = screenFor('hermes').inspect(capture(input))
      expect(screen.teamHold).toBe('team_waiting_draft')
      expect(inspectCloseActivity(session, screen, false, false)).toBe('draft')
    }
  })
})
