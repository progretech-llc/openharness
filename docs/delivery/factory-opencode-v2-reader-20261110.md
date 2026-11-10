# OpenCode 2 status and transcript recovery

Codex session PID28011, coordinator task ux-source-redesign-20261109. Actual project:
/mnt/PT-Storage/Projects/development/factory-alt/pt-openharness-factory-alt-dev.
Implementation workspace: /mnt/PT-Storage/Projects/.worktrees/openharness-opencode-v2-20261110.

The installed OpenHarness build read only legacy message/part tables. OpenCode2.1.1
wrote session_message, so active local workers displayed idle, empty output and zero
tools. Native session export and read-only store observations proved the discrepancy.
A prior source-only repair exists at7c717fb0f, but it was absent from the installed
6b1c39232 source. This repair retains inline block adaptation, uses native seq for
incremental ordering, reads native user.text, preserves tool results and waits for
native idle rather than assistant finish to close a turn. Failure/interruption
outcomes remain in source data; completion is never artifact acceptance.

Checks:23 focused reader/normalizer tests passed and typecheck passed. A protected
disposable snapshot of two actual company worker sessions produced nonempty prompts,
11 and13 tool records, and open turns in6.4ms/2.5ms for initial reads plus hydration.
Tests used disposable databases. No extra model inference was commissioned for this
verification. Legacy behavior is covered by the existing focused cases.

Installed using the repository's native install-cli.sh --no-build, from the exact
installed6b1c39232 source baseline plus the reader change. Version:
0.5.94-dev.6b1c39232.factory-v2-reader. Native stop/start retained all four original
terminal pane IDs and PIDs. The two visible role-owned workers then reported working,
actual prompts/answers and11/13 tools. Existing source worktrees and other owners'
changes were preserved. Rollback bytes are protected local runtime evidence; never
publish their account/runtime state.

Two earlier Mak analysis sessions, already closed in the Harness UI, still ran in
native OpenCode. Inspection found read-only tools, no changed snapshot files and no
pending permissions. Native session.interrupt returned true for both; session.active
then listed only the surviving Mak/Lyra workers. Conversation history was retained.
No product implementation was performed during this framework repair.

Grounding: current factory baseline/CURRENT-MODEL, applicable project/CLI AGENTS and
validation-and-release; actual RAG CURRENT-MODEL passages; Hindsight search/read for
native ownership continuity. Old memory is historical; live evidence controls.

NOT RELEASED upstream; company WIP source checkpoint and local factory install only.
