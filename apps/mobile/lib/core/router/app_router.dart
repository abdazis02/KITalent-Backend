import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import '../../features/approvals/approvals_screen.dart';
import '../../features/attendance/attendance_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/leave/leaves_screen.dart';
import '../../features/leave/leave_request_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/payslip/payslips_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/splash/splash_screen.dart';

class Routes {
  static const splash = '/splash';
  static const login = '/login';
  static const home = '/home';
  static const attendance = '/attendance';
  static const leaves = '/leaves';
  static const payslips = '/payslips';
  static const approvals = '/approvals';
  static const profile = '/profile';
  static const leaveNew = '/leaves/new';
  static const notifications = '/notifications';
}

final routerProvider = Provider<GoRouter>((ref) {
  // Bridge Riverpod auth changes → go_router refresh.
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      // Still bootstrapping from secure storage → stay on splash.
      if (!auth.isKnown) return loc == Routes.splash ? null : Routes.splash;

      final atAuthRoute = loc == Routes.login || loc == Routes.splash;
      if (!auth.isAuthenticated) return atAuthRoute && loc == Routes.login ? null : Routes.login;
      if (atAuthRoute) return Routes.home;
      return null;
    },
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: Routes.login, builder: (_, __) => const LoginScreen()),
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: Routes.home, builder: (_, __) => const HomeScreen()),
          GoRoute(path: Routes.attendance, builder: (_, __) => const AttendanceScreen()),
          GoRoute(path: Routes.leaves, builder: (_, __) => const LeavesScreen()),
          GoRoute(path: Routes.payslips, builder: (_, __) => const PayslipsScreen()),
          GoRoute(path: Routes.approvals, builder: (_, __) => const ApprovalsScreen()),
          GoRoute(path: Routes.profile, builder: (_, __) => const ProfileScreen()),
        ],
      ),
      // Full-screen pushed routes (outside the bottom-nav shell).
      GoRoute(path: Routes.leaveNew, builder: (_, __) => const LeaveRequestScreen()),
      GoRoute(path: Routes.notifications, builder: (_, __) => const NotificationsScreen()),
    ],
  );
});
