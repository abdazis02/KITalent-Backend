import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/router/app_router.dart';

/// Bottom-navigation shell wrapping the main self-service tabs.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static final _tabs = [
    (route: Routes.home, icon: PhosphorIconsRegular.house, active: PhosphorIconsFill.house, label: 'nav.home'),
    (route: Routes.attendance, icon: PhosphorIconsRegular.fingerprint, active: PhosphorIconsFill.fingerprint, label: 'nav.attendance'),
    (route: Routes.leaves, icon: PhosphorIconsRegular.calendarX, active: PhosphorIconsFill.calendarX, label: 'nav.leaves'),
    (route: Routes.approvals, icon: PhosphorIconsRegular.listChecks, active: PhosphorIconsFill.listChecks, label: 'nav.approvals'),
    (route: Routes.profile, icon: PhosphorIconsRegular.user, active: PhosphorIconsFill.user, label: 'nav.profile'),
  ];

  int _indexFor(String location) {
    final i = _tabs.indexWhere((t) => location.startsWith(t.route));
    return i < 0 ? 0 : i;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _indexFor(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(_tabs[i].route),
        destinations: [
          for (final t in _tabs)
            NavigationDestination(icon: Icon(t.icon), selectedIcon: Icon(t.active), label: t.label.tr()),
        ],
      ),
    );
  }
}
