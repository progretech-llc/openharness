# Embedded viewers on Linux

Linux Harness workspaces can display their web viewers beside the agent terminal, using WebKitGTK 4.1 through `webview_all`.

![Memories rendering inside the Harness Linux viewer pane beside its agent terminal](memories-linux.png)

Screenshot supplied and approved for publication by Edwin Rodriguez (ProgreTech), October 16, 2026. The owner confirmed that Memories renders inside Harness after restarting the patched desktop build.

## Try it

Install the WebKitGTK 4.1 runtime (`libwebkit2gtk-4.1-0` on Ubuntu), build the desktop application, and open a workspace with a viewer, such as Memories. The page appears in the left pane beside the agent terminal.

Linux viewer panes use rectangular clipping because the native GTK overlay hides itself under rounded Flutter clips. Terminal panes retain their rounded clipping.

## Verification

- Ubuntu 26.04 x64, Flutter 3.47.2, Dart 3.13.2, WebKitGTK 4.1.
- The initial viewer and Store dialog tests passed (18 tests).
- After the clipping correction, all 14 viewer tests passed, including a regression assertion checking the viewer's ancestor clipping.
- Linux release compilation passed. The owner verified the rendered Memories page shown above.

The AppImage requires the host WebKitGTK runtime; it is not bundled. The screenshot confirms page rendering, but does not establish that every viewer, media feature, dialog overlay, or keyboard interaction works. macOS behavior was not exercised on this Linux host.

For local Linux packages, follow the existing release packaging convention and put the build version in `version.txt` beside the executable. Omitting it makes the application report the placeholder version from `pubspec.yaml` and offer an unnecessary update. The current local package uses `1.2.90+progretech.viewer.1`, based on upstream tag `v1.2.90_desktop`. PR #1387 remains open, so the stable Linux release still needs this patch. The update retains upstream viewer retry and load tracking.

Run `FLUTTER_TEST=1 dbus-run-session -- xvfb-run -a flutter test -d linux --no-pub integration_test/linux_viewer_native_test.dart` for a native WebKitGTK check using a local HTTP fixture. It verifies page loading, JavaScript interaction, and modal hide/restore without reloading the page. Optional `HARNESS_NATIVE_SHOTS_DIR` captures the viewer, dialog, and restored page under X11.

## 1.2.90 local update (October 18, 2026)

Reapplied the viewer patch to upstream `v1.2.90_desktop` without conflicts. The Linux release build, 98 selected viewer, Store dialog, model catalog, privacy, settings and resource tests, and the native Linux viewer integration test passed. Installed locally as `1.2.90+progretech.viewer.1`. The extracted local bundle still requires manual updates so the viewer patch is retained.

## Radeon local-model launch (October 18, 2026)

The local CLI patch honours `CUDA_VISIBLE_DEVICES=-1` when Grid's hardware probe still reports CUDA. Listings and launch checks use currently free host RAM rather than the unrelated NVIDIA card's VRAM. Other CUDA configurations retain their existing checks. Harness's Ollama child inherits `OLLAMA_VULKAN=1`, `GGML_VK_VISIBLE_DEVICES=1`, `OLLAMA_IGPU_ENABLE=1` and the PT-Storage `OLLAMA_MODELS` path from the local harnessd service override. These device settings are specific to this workstation; recheck Vulkan device ordering if hardware changes.

Validation: TypeScript checks and all 262 local-model tests passed, including a mixed GPU launch regression and the isolated integration suite; the local-model coverage gate passed at 100%. Installed CLI version: `0.4.19+progretech.radeon.1`, with CLI self-update disabled to retain the patch. The desktop viewer build is unchanged.
