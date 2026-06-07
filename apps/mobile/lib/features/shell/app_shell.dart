import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';

/// Bottom-navigation shell wrapping the main self-service tabs.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const _tabs = [
    (route: Routes.home, icon: Icons.home_outlined, active: Icons.home, label: 'nav.home'),
    (route: Routes.attendance, icon: Icons.fingerprint, active: Icons.fingerprint, label: 'nav.attendance'),
    (route: Routes.leaves, icon: Icons.event_busy_outlined, active: Icons.event_busy, label: 'nav.leaves'),
    (route: Routes.approvals, icon: Icons.checklist_outlined, active: Icons.checklist, label: 'nav.approvals'),
    (route: Routes.profile, icon: Icons.person_outline, active: Icons.person, label: 'nav.profile'),
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
