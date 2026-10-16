# PyCharm workspace

Use this workspace as the project root for coding tasks. Keep project files in the workspace and use the selected Harness agent for edits and explanations.

When the user asks to open or switch to PyCharm, launch the installed IDE for this workspace with:

```sh
"${PYCHARM_EXECUTABLE:-pycharm}" "$PYCHARM_WORKSPACE" >/dev/null 2>&1 &
```

The executable can be overridden with `PYCHARM_EXECUTABLE` when the `pycharm` command is not on `PATH`. Do not launch the IDE automatically during setup or workspace creation. Do not install or update PyCharm; the user manages the IDE installation and license.
