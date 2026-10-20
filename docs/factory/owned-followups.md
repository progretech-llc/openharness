# Native owned follow-ups

The factory needs an outside agent to continue a native worker it created. `harness send` remains the existing pane/shared-tab API. `harness followup <session> --text-file - --key <unique-id> --json` uses native ledger authority, idle inspection and the input queue. It does not fabricate a pane or impersonate a person.

The existing messages service persists bounded receipt metadata before handoff, hashes the body and refuses conflicting key reuse. Repeated keys return their receipt. Restarted uncertain admissions become unknown without replay. Native leases, permissions and agentsStartAgents still apply. Prompt text is not persisted in receipts; corrupt receipts fail this capability closed.

`followup --check --json` reports authority without writing. A manually created session can grant itself follow-up access with `delegate-followup <its-own-id> --controller agent:mesh:mesh-native-gateway --json`; `--revoke` withdraws it. The actual caller must be inside that target. Grants preserve creator, parent and close/spawn authority. Only idle live local sessions accept follow-ups; inspect unknown delivery before retrying.

Focused tests and isolated real-daemon E2E cover ownership, duplicate keys, conflicting body refusal, unknown restart, foreign-session refusal, native self-grant, actual delivery and continued refusal to close another owner's session. Tests use isolated fake engines, never real workstation sessions.

Monitor, Memories and Grid native store clients now send the daemon's existing same-user local credential in a header, with owner/mode/symlink checks. The daemon's authentication requirement remains enabled. Monitor's authenticated live inventory was verified after native installation; all 128 Monitor tests passed.
