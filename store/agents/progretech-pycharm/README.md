# PyCharm for Harness

An AI-assisted ProgreTech Harness DSH package for coding in a project workspace and opening that workspace in the locally installed PyCharm IDE on request.

## Requirements

- Harness with DSH support
- Codex engine selected in Harness
- PyCharm installed separately

The package does not install PyCharm. It discovers a `pycharm` launcher on `PATH`, or accepts an explicit executable path through `PYCHARM_EXECUTABLE`.

## Install

```sh
harness dsh install https://github.com/progretech-llc/openharness --ref codex/pycharm-store-harness --path store/agents/progretech-pycharm
```

Create a Harness from **PyCharm**, then ask the agent to open the current workspace in PyCharm. The IDE is not launched during installation or workspace creation.

## License and trademarks

The package files are MIT licensed. PyCharm is a product and trademark of JetBrains s.r.o.; this community package is not affiliated with or endorsed by JetBrains. PyCharm must be installed and licensed according to JetBrains' terms.
