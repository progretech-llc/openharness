# Opt-in Codex observation: source candidate

This change adds `harness new codex --codex-observation <local-spec.json>` to the CLI source. It has not been installed or activated. Root's productive-artifact progress gate can proceed independently; this optional instrumentation remains available for later qualification.

The file must be regular, at most 4,096 bytes, and contain exactly these fields:

```json
{
  "kind": "factory-native-progress-v1",
  "run_id": "cohort-example",
  "otlp_http_endpoint": "http://127.0.0.1:11530/v1/logs",
  "protocol": "json",
  "log_user_prompt": false,
  "lifetime_seconds": 600
}
```

The run ID is a public ASCII slug of 1–64 characters, beginning with a letter or digit. Lifetime is an integer from 1 to 1,800 seconds for the observer; it creates no worker timer. Unknown keys, arbitrary arguments/TOML, headers, credentials, alternate destinations and supplied environment labels are rejected. The CLI validates before contacting the daemon or checking admission. The create boundary independently validates before recording a creation receipt, preparing a project or inspecting an engine. Observation is restricted to new plain Codex sessions; resumed conversations, Store harnesses and guest launches cannot take it.

The create path derives `factory-soak-<run_id>-<creationId>` from the actual creation identity and appends only three supported `-c` settings to the existing launch argument mechanism: `otel.environment`, `otel.log_user_prompt=false`, and the fixed JSON HTTP exporter. Ordinary launches retain their existing payload and arguments. Caller admission, child limits/depth, permissions, first prompt, model/provider and authentication home keep their existing paths. Observation settings are not saved as restart arguments or written to native configuration.

After a pane is registered, one nonsecret journal row records the spec SHA-256, effective observation arguments, run ID, creation ID, environment, observer lifetime and actual Harness ID. Its state is `pane-created`: it does not establish a running native conversation or productive execution. The receiver must independently bind the native thread and qualify events.

## Checks and remaining limits

The final focused run passed 436 tests, with four existing platform/opt-in skips; typecheck and architecture checks passed. Tests cover parser and file bounds, privacy canaries, exact argument insertion, ordinary payloads, quota refusal, malformed wire/recovered input and launch-authority fencing. The changed core modules and parser pass 100% per-file statements, branches, functions and lines. A real disposable daemon/private tmux test uses fake Codex and throwaway homes to verify rejection before project creation, exact opt-in arguments, preserved `--no-daemon` and permissions, safe binding metadata, and an ordinary launch without telemetry. The fixture explicitly secures its private state directory under this host's group-writable umask; production directory checks remain intact. Typecheck passes. These checks use no real account, model or collector.

[Official OpenAI configuration documentation](https://learn.chatgpt.com/docs/config-file/config-reference) documents the exporter, JSON protocol and prompt-log setting. Its [security documentation](https://learn.chatgpt.com/docs/agent-approvals-security) describes batched telemetry. Soak's retained, hashed `rust-v0.166.0` source proof supplies the version-specific limits: the resource field is `env`; SSE event kind does not include nonempty delta length; tool logs can include raw arguments/output and account metadata. The reviewed receiver must discard those fields in memory before persistence. This patch neither activates that receiver nor establishes emission, continuous execution, timing, audible delivery or ten-worker acceptance. Root review and one separately authorized native qualification are still required.

## Build and deployment boundary

The branch starts at installed-source commit `7c717fb0f43fa3aafb677a4b847b3ff1f42a856e`, preserving its shipped launch/depth fixes. The canonical checkout's older foreign branch and dirty files were left alone. The installed CLI reports `0.4.59-dev.7c717fb0f`; its SHA-256 is `3d45e72f37aeb756be9f8981d1ca117114d30f7dc89e61a6b0bafebd8632fcde`, exactly matching the retained prior build in the parser worktree. A pristine rebuild has an identical main-program prefix and notification helper; its packed lean files differ, so a byte-reproducible whole-bundle claim is not made. The candidate's commit, dependency lock, toolchain and artifact hashes are retained separately in the owned runtime handoff.

A future deployment concerns only the CLI component, not Desktop or device profiles. Root must review the patch and complete bundle, preserve the installed preimage/backup, then authorize a guarded bundle replacement and controlled Harness core handover at a safe owner checkpoint. Replacing the frontend file alone does not update a running core's create validator; an older core could ignore the added payload field. Do not use the option until the active core is verified to contain the change. No such installation, handover, role restart or native task was performed here.

Grounding used the current factory baseline and expectations, OpenHarness AGENTS/contribution/validation instructions, Ponytail and API boundary guidance. Native RAG passages from factory-architecture.html, factory-expectations.html and factory-integration-validation.html distinguish ownership and scoped evidence from execution claims. The relevant native Hindsight page was read and contained no content; no historical acceptance claim was inferred.
