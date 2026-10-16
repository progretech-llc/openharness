#!/usr/bin/env bash
set -euo pipefail
workspace="${1:?workspace path required}"
mkdir -p "$workspace"
if [[ ! -e "$workspace/README.md" ]]; then
  cat > "$workspace/README.md" <<'DOC'
# PyCharm project

Project files for this Harness workspace.
DOC
fi
