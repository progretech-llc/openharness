import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:webview_all/webview_all.dart';
import 'package:window_manager/window_manager.dart';

import 'package:harness/auth/auth_session.dart';
import 'package:harness/core/config.dart';
import 'package:harness/core/local_key_value_store.dart';
import 'package:harness/core/test_run.dart';
import 'package:harness/shared/theme/app_theme.dart' as grid;
import 'package:harness/state/app_state.dart';
import 'package:harness/state/terminal_pane.dart';
import 'package:harness/widgets/web_pane_panel.dart';

class _MemoryStore implements LocalKeyValueStore {
  final data = <String, String>{};
  @override
  Future<String?> read(String key) async => data[key];
  @override
  Future<void> write(String key, String value) async => data[key] = value;
  @override
  Future<void> delete(String key) async => data.remove(key);
}

void main() {
  if (!Platform.isLinux || !kUnderTest) {
    throw StateError('Run on Linux with FLUTTER_TEST=1');
  }
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Linux viewer loads, runs JavaScript and survives a modal', (
    tester,
  ) async {
    await windowManager.ensureInitialized();
    await windowManager.setSize(const Size(1000, 700));
    await windowManager.show();
    await tester.binding.setSurfaceSize(const Size(1000, 700));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    var requests = 0;
    server.listen((request) async {
      requests++;
      request.response.headers.contentType = ContentType.html;
      request.response.write('''<!doctype html><body style="background:#123d32;color:white;font:28px sans-serif;padding:60px">
<h1>Linux WebView verified</h1><button onclick="this.textContent='Clicked'">Test interaction</button>
<script>window.fixtureState='preserved';</script></body>''');
      await request.response.close();
    });
    addTearDown(() => server.close(force: true));
    final app = AppNotifier(
      config: AppConfig.dev,
      authSession: AuthSession(storage: _MemoryStore()),
    );
    addTearDown(app.dispose);
    WebPanePanel.webviewAvailableForTest = true;
    addTearDown(() => WebPanePanel.webviewAvailableForTest = null);
    await tester.pumpWidget(
      MaterialApp(
        theme: grid.buildAppTheme(brightness: Brightness.dark),
        home: Scaffold(
          body: WebPanePanel(
            notifier: app,
            pane: TerminalPane(
              id: 1,
              machineId: 'fixture',
              ownerAgentId: 'fixture-agent',
              kind: PaneKind.web,
              url: 'http://127.0.0.1:${server.port}/',
            ),
            ownerName: 'Local fixture',
            ownerEngine: null,
          ),
        ),
      ),
    );
    final deadline = DateTime.now().add(const Duration(seconds: 30));
    String body = '';
    while (DateTime.now().isBefore(deadline)) {
      await tester.pump(const Duration(milliseconds: 100));
      final views = find.byType(WebViewWidget);
      if (views.evaluate().isEmpty) continue;
      body =
          (await tester
                  .widget<WebViewWidget>(views)
                  .platform
                  .params
                  .controller
                  .runJavaScriptReturningResult('document.body.innerText'))
              .toString();
      if (body.contains('Linux WebView verified')) break;
    }
    expect(body, contains('Linux WebView verified'));
    final controller = tester
        .widget<WebViewWidget>(find.byType(WebViewWidget))
        .platform
        .params
        .controller;
    await controller.runJavaScript('document.querySelector("button").click()');
    expect(
      (await controller.runJavaScriptReturningResult('document.body.innerText'))
          .toString(),
      contains('Clicked'),
    );
    await _photograph(tester, 'viewer');
    final view = tester.element(find.byType(WebViewWidget));
    final context = tester.element(find.byType(WebPanePanel));
    final dialog = showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close tab?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Close tab?'), findsOneWidget);
    expect(find.byType(WebViewWidget), findsNothing);
    expect(find.byType(WebViewWidget, skipOffstage: false), findsOneWidget);
    await _photograph(tester, 'dialog');
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    await dialog;
    expect(tester.element(find.byType(WebViewWidget)), same(view));
    expect(
      (await controller.runJavaScriptReturningResult('window.fixtureState'))
          .toString(),
      contains('preserved'),
    );
    expect(
      (await controller.runJavaScriptReturningResult('document.body.innerText'))
          .toString(),
      contains('Clicked'),
    );
    expect(
      requests,
      1,
      reason: 'Dismissal must restore the existing page without reloading',
    );
    await _photograph(tester, 'restored');
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
}

Future<void> _photograph(WidgetTester tester, String name) async {
  final directory = Platform.environment['HARNESS_NATIVE_SHOTS_DIR'];
  if (directory == null) return;
  await tester.pump(const Duration(seconds: 1));
  final result = await Process.run('/usr/bin/python3', [
    '-c',
    '''
import gi, sys
gi.require_version('Gdk', '3.0')
from gi.repository import Gdk
window = Gdk.get_default_root_window()
Gdk.pixbuf_get_from_window(window, 0, 0, window.get_width(), window.get_height()).savev(sys.argv[1], 'png', [], [])
''',
    '$directory/$name.png',
  ]);
  expect(result.exitCode, 0, reason: result.stderr.toString());
}
