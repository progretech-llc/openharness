#!/usr/bin/env bash
set -euo pipefail
if [[ -n "${PYCHARM_EXECUTABLE:-}" ]]; then
  if [[ -x "$PYCHARM_EXECUTABLE" ]]; then
    printf 'PyCharm launcher found: %s\n' "$PYCHARM_EXECUTABLE"
    exit 0
  fi
  printf 'PYCHARM_EXECUTABLE is set but is not executable: %s\n' "$PYCHARM_EXECUTABLE" >&2
  exit 1
fi
if command -v pycharm >/dev/null 2>&1; then
  printf 'PyCharm launcher found: %s\n' "$(command -v pycharm)"
  exit 0
fi
printf 'PyCharm launcher not found. Add `pycharm` to PATH or set PYCHARM_EXECUTABLE.\n' >&2
exit 1
