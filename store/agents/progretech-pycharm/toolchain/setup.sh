#!/usr/bin/env bash
set -euo pipefail
# PyCharm is a user-managed IDE. Setup only checks its availability; it never installs it.
"$(dirname "$0")/doctor.sh"
