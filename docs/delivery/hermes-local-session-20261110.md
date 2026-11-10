# Hermes local-session visibility repair

The current Hermes CLI stores interactive sessions as `local-<64hex>` with source `local`. The installed Harness declaration accepted dated CLI IDs and ACP UUID history only. A real Progre worker therefore executed tools while Harness reported unknown state, null ask and zero tools.

The declaration now recognizes the bounded local ID shape for history and interactive source admission. Existing dated CLI/TUI IDs, ACP history-only behavior, source validation and delegated-child isolation remain. No model, permission, process ownership, core logic or session database is changed.

Validation: 81 focused Hermes/history tests passed; TypeScript checking passed; three isolated daemon admission cases passed, including the new local-ID case and existing missing/stalled optional-code recovery. The initial isolated daemon run failed before admission because the inherited umask made its temporary state directories group writable. The corrective run used umask077; production security checks were preserved. One new assertion was corrected to the existing invalid-ID empty-string contract; product behavior was not changed to satisfy it.

This branch includes the deployed OpenCode2 scoped configuration fix4674e616. The unrelated controller experiment remains NOT RELEASED and is not part of this build. Installation and actual native Progre reattachment require separate evidence after bundle preparation. Native terminals and histories must remain intact during adapter restart.

The second compatibility increment also recognizes the current managed launcher's exact standard-library closure-repair import, accepts local interactive rows in native hook fallback, and includes local rows in history search. Both process matchers retain the bootstrap/main checks; malformed IDs and delegated sources remain excluded. The actual native hook inspection found two allowed hooks and no consent/mtime warnings.

Validation for this increment: 232 focused hook/process/history/Hermes tests passed, TypeScript checking passed, and all three isolated daemon admission cases passed under umask077. These checks are framework checks, not automated product QA. Actual live session visibility remains a separate installation acceptance check.

Live follow-up found another hold: the real Hermes history DB exceeded70MB, while identity admission rejected every pool above64MiB before running its indexed query. Indexed source identity lookups now allow a larger main history file only after the existing ordinary-table and leading-primary-key checks. All journal bytes, discovery scans, schema/control-column validation, row/output bounds, metadata race checks and the shared deadline remain. This does not raise the discovery scan cap; after adapter restart a large history store needs its next native session hook for binding.

Validation: 78 focused store-pool/admission tests and TypeScript checking passed. New cases exercise a real70MiB ordinary SQLite file and preserve rejection of an oversized journal; the existing discovery cap remains tested. No history database or runtime registry is edited by this repair.
