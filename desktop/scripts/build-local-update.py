#!/usr/bin/python3
"""Build an offered upstream release with this checkout's committed local patches."""

import fcntl
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
FLUTTER = Path('/mnt/PT-Storage/Tools & Assets/flutter/bin/flutter')
PUB_CACHE = '/mnt/PT-Storage/Tools & Assets/dart-pub-cache'
UPSTREAM = 'https://github.com/autonomous-ai/openharness.git'


def build(version, output):
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Expected an upstream desktop release version')
    output = Path(output).resolve()
    if output.exists():
        raise ValueError('Output must not already exist')
    state = Path.home() / '.local/state/harness-local-update'
    state.mkdir(parents=True, exist_ok=True)
    with (state / 'build.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with (state / 'build.log').open('w') as log:
            env = dict(os.environ, PUB_CACHE=PUB_CACHE)
            # A launched AppImage's loader paths must not contaminate build tools.
            for key in ('LD_LIBRARY_PATH', 'LD_PRELOAD', 'APPIMAGE', 'APPDIR'):
                env.pop(key, None)

            def run(*args, cwd=SOURCE, timeout=1200):
                print('+', *map(str, args), file=log, flush=True)
                subprocess.run(list(map(str, args)), cwd=cwd, env=env,
                               stdout=log, stderr=subprocess.STDOUT,
                               check=True, timeout=timeout)

            with tempfile.TemporaryDirectory(prefix='harness-update-source-',
                                             dir=state) as temporary:
                checkout = Path(temporary) / 'source'
                run('git', 'clone', '--shared', '--no-checkout', SOURCE, checkout)
                run('git', 'checkout', '--detach', 'HEAD', cwd=checkout)
                tag = f'v{version}_desktop'
                run('git', 'fetch', '--no-tags', UPSTREAM,
                    f'refs/tags/{tag}', cwd=checkout)
                # Conflicts abort the build; never substitute an unpatched release.
                run('git', '-c', 'user.name=ProgreTech local updater', '-c',
                    'user.email=local-updater@localhost', 'merge', '--no-edit',
                    'FETCH_HEAD', cwd=checkout)
                desktop = checkout / 'desktop'
                run(FLUTTER, 'pub', 'get', cwd=desktop)
                run(FLUTTER, 'analyze', 'lib/update/desktop_updater.dart', cwd=desktop)
                run(FLUTTER, 'test', '--no-pub', 'test/desktop_updater_test.dart',
                    'test/web_pane_test.dart', 'test/store_demo_dialog_test.dart',
                    cwd=desktop)
                run('env', 'FLUTTER_TEST=1', 'dbus-run-session', '--',
                    'xvfb-run', '-a', FLUTTER, 'test', '-d', 'linux', '--no-pub',
                    'integration_test/linux_viewer_native_test.dart', cwd=desktop)
                run(FLUTTER, 'build', 'linux', '--release',
                    f'--build-name={version}', '--build-number=1',
                    f'--dart-define=DESKTOP_LOCAL_UPDATE_BUILDER={Path(__file__).resolve()}',
                    cwd=desktop)
                bundle = desktop / 'build/linux/x64/release/bundle'
                (bundle / 'version.txt').write_text(f'{version}+progretech.viewer.1\n')
                revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'],
                                                   cwd=checkout, text=True).strip()
                (bundle / 'local-update-source.txt').write_text(
                    f'upstream={tag}\nmerged_revision={revision}\n'
                    f'patch_source={SOURCE}\n')
                shutil.copytree(bundle, output)


if __name__ == '__main__':
    try:
        if len(sys.argv) != 3:
            raise ValueError('Usage: build-local-update.py VERSION NEW_BUNDLE_PATH')
        build(*sys.argv[1:])
    except Exception as error:
        print(f'{error}; details: ~/.local/state/harness-local-update/build.log',
              file=sys.stderr)
        sys.exit(1)
