# Monitor singleton cleanup — 2026-10-20

Task: monitor-singleton. Owner: Ed-selected Codex session on progretech-MS-S1-MAX (persistent CLI PID 28322); no child agents. Project/worktree: /mnt/PT-Storage/Projects/openharness. Implementation and validation: current Codex model/session. State: complete locally; source delivery recorded by this commit and its live remote branch.

Ed requested removal of duplicate Harness Monitor sessions and one monitor at a time. Scope: native monitor creation, duplicate stop/delete eligibility, focused tests, installed CLI. No other sessions or project folders were removed.

The shared creator reuses the registered monitor, including concurrent launch requests. The viewer protects one live monitor and permits duplicate cleanup, refreshing the full inventory before acting. Reviewed deletion permits removing a duplicate while another live monitor remains. Existing launch authority, conversation identity and workspace protections remain.

Stopped and then permanently removed empty duplicate records 657e3077-0478-4ac1-a9d4-24accc619689 and 14d2807f-5815-4d7c-9291-2a1ff4e0649e using native APIs. Both reviewed session-data sizes were zero. Workspaces and branches were kept. Full inventory, including stopped sessions, now contains one monitor: 9ee94c4b-524a-434f-affd-c035ce6d7407.

Validation:

- Focused creator, purge and architecture: 99 tests passed.
- Monitor package: 130 tests passed.
- TypeScript typecheck passed; bundle succeeded; git diff --check passed.
- Wider core suite: 2829 passed, 2 failed. Failures persist in an isolated rerun (28 passed, 2 failed): services/recaps.spec.ts reports a group/world-writable state file; services/handoffProcess.spec.ts returns HANDOFF_UNAVAILABLE instead of a file. Those paths were not changed; no claim that the entire core suite passes.
- Installed and activated 0.4.19+progretech.factory.12 using install-cli.sh --no-build --no-updates, preserving the existing disabled-update setting. Two concurrent live agent_create requests returned the same existing monitor ID, without creating another process.

Source is delivered on progretech/monitor-singleton-cleanup; no merge or public release is implied. Other pre-existing AGENTS.md and delivery-directory changes are excluded. Roll back source with the parent commit and rebuild/reinstall; deleted empty monitor records can be recreated, but workspaces were never deleted. No manual desktop screenshot validation or remote offline-machine test was performed.
