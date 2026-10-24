# Patched OpenHarness update — 24 October 2026

Desktop 1.3.14 was integrated with the company Linux embedded WebKit viewer and patch-preserving updater. CLI 0.4.59 was integrated on a separate branch so newer desktop development did not enter the desktop release build. Live company patch branches were checked; no newer laptop-specific patch was found.

The desktop bundle was built from the desktop branch and installed at `/mnt/PT-Storage/Tools & Assets/Harness/Desktop`. `/home/progretech/.harness/Desktop` resolves to the same filesystem object. Version: `1.3.14+progretech.viewer.1`. The previous bundle is retained as `Desktop.rollback-20261024`. The installed updater references this checkout's `desktop/scripts/build-local-update.py`; retain the checkout for subsequent patched updates.

CLI was installed using its source installation script, version `0.4.59-dev.b055c88e2`. The daemon restarted and connected to its backend. Native session state remains outside the application bundle.

A purge regression was fixed: when the native engine already removed a conversation, stale Harness metadata can be removed without writing to the shared conversation database. Trigger and foreign-key guards remain for existing conversations.

Validation: 605 CLI tests passed across eight focused files; latest CLI typecheck passed. Desktop updater/viewer/dialog tests: 55 passed, three platform skips. Native Linux viewer test passed rendering, JavaScript and modal hide/restore. Optional screenshot capture under Xvfb failed to obtain a root surface; functional validation was rerun successfully without that optional helper. Targeted Dart analysis had one informational preexisting container lint and no warnings or errors. Release Linux build passed. Running desktop loaded WebKitGTK.

At owner request, all four remaining nonutility harnesses were stopped. Native API verification showed only Harness Monitor and Devices open. The Grok conversation lacked a saved descriptor, so its exact terminal pane was stopped without deleting project data. Prior confirmed idle worker cleanup is scoped to their stopped identities; unrelated historical stopped sessions are retained.
