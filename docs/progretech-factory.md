# ProgreTech workstation factory patch

Owner-authorized operational commissioning, 2026-10-19. The canonical fork defaults fresh unselected OpenCode engineering sessions to the existing workstation Ollama Qwen3 Coder 30B endpoint. Explicit Grid routes, restored sessions and package-selected providers remain explicit choices; no hosted fallback is added. Build and plan retain their permission policy and tool/config inheritance.

The launch supplies the local provider definition and model context/output limits. It does not depend on a previously selected OpenCode model or inject unsupported hosted reasoning settings. A separate native OpenCode build-agent tool filter keeps broad GitHub/Stripe/media/retrieval schemas out of ordinary repository work; specialist media/research routes remain available.

Observed before the fix: a fresh native launch injected a hosted Muse default and the live session used the small Qwen utility model. After the fix: the native child process and TUI both selected ollama/qwen3-coder:30b. Bounding engineering tools reduced the observed initial prompt from 57,463 to 13,428 tokens. Model correctness still requires acceptance checks; local code/review output is not automatically trusted.

Checks: 139 focused launch/default/resume/CLI tests; typecheck; 262 local-model tests with 100% measured coverage. Golden launch fixtures were updated only for the intended native provider defaults. Use the managed Harness Node for these fixtures, whose path normalizer otherwise rewrites /usr/bin platform text.

Local installation used `ADAPTER_VERSION=0.4.19+progretech.factory.6 npm run bundle` in cli/, then `bash scripts/install-cli.sh --no-build --no-updates`. This rebuilds from the existing fork and reconnects the machine daemon; it does not publish an upstream release. Saved conversations and machine identity remain intact. Self-update stays pinned to preserve this patch; upstream updates must retain or reapply it.

Rollback: revert this source commit, rebuild/install through the same native script, and restore the prior native OpenCode model/filter fields from the factory change ledger. No credentials or runtime databases belong in source.
