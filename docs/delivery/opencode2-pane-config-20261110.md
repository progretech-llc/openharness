# OpenCode 2 worker configuration scope

Card 307, supervision 283. Native saved records showed the SRE planner and Stock
worker running local gpt-oss:20b while their pane environments selected local
qwen3-coder:30b. The shared OpenCode 2 service did not receive the pane-specific
configuration document. A native private-server config read received that document.
The configuration banner alone therefore did not establish the effective model.

The launch helper now adds the supported --standalone flag for a verified OpenCode 2
launch. Explicit --server routes keep their selected service, and an existing
--standalone flag is preserved once. Version 1 and unknown versions are unchanged.
No model weights, budgets, provider connections, native databases or existing worker
sessions are rewritten. The earlier OpenCode 2 transcript-reader fix is retained.

Validation: 189 affected unit checks passed, four existing cases skipped, and
TypeScript checking passed. The checks cover launch argument precedence plus native
reader/model-control regressions. The local bundle built successfully. This source
checkpoint is NOT an upstream release or merge. Installed runtime and useful next
worker execution are recorded separately on the board; an old worker remains on
its previous native session until its owner safely corrects or replaces it.

Use actual native session/assistant model readback after commissioning. Keep worker
ownership, real grounding retrieval, bounded artifacts and complete review. A model
name in a brief is not configuration or acceptance. Preserve an exact prior bundle
for rollback and verify existing worker process identities after reconnection.
