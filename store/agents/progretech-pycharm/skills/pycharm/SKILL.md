---
name: pycharm
description: Open the current Harness workspace in the installed PyCharm IDE when the user asks.
---

# Open a workspace in PyCharm

When the user explicitly asks to open the project in PyCharm, launch the IDE for the current workspace:

```sh
"${PYCHARM_EXECUTABLE:-pycharm}" "$PYCHARM_WORKSPACE" >/dev/null 2>&1 &
```

If the command is unavailable, report that PyCharm is not installed or not on `PATH`, and explain that `PYCHARM_EXECUTABLE` can point to its launcher. Do not install the IDE or launch it without the user's request.
