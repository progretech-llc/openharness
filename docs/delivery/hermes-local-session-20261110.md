# Hermes local-session visibility repair

The current Hermes CLI stores interactive sessions as `local-<64hex>` with source `local`. The installed Harness declaration accepted dated CLI IDs and ACP UUID history only. A real Progre worker therefore executed tools while Harness reported unknown state, null ask and zero tools.

The declaration now recognizes the bounded local ID shape for history and interactive source admission. Existing dated CLI/TUI IDs, ACP history-only behavior, source validation and delegated-child isolation remain. No model, permission, process ownership, core logic or session database is changed.

Validation: 81 focused Hermes/history tests passed; TypeScript checking passed; three isolated daemon admission cases passed, including the new local-ID case and existing missing/stalled optional-code recovery. The initial isolated daemon run failed before admission because the inherited umask made its temporary state directories group writable. The corrective run used umask077; production security checks were preserved. One new assertion was corrected to the existing invalid-ID empty-string contract; product behavior was not changed to satisfy it.

This branch includes the deployed OpenCode2 scoped configuration fix4674e616. The unrelated controller experiment remains NOT RELEASED and is not part of this build. Installation and actual native Progre reattachment require separate evidence after bundle preparation. Native terminals and histories must remain intact during adapter restart.
