import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/account/me_provider.dart';
import '../../core/router/app_router.dart';
import '../../shared/widgets/app_logo.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(size: 30, withWordmark: true),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.bell),
            tooltip: 'notifications.title'.tr(),
            onPressed: () => context.push(Routes.notifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        // Manual refresh (rule #1) — pull down to refetch.
        onRefresh: () => ref.refresh(meProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            me.when(
              loading: () => Text('home.greeting'.tr(), style: Theme.of(context).textTheme.titleLarge),
              error: (_, __) => Text('home.greeting'.tr()),
              data: (u) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('home.greeting'.tr(), style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 2),
                  Text(u.email, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('home.quickActions'.tr(), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 1.45,
              children: [
                _ActionCard(icon: PhosphorIconsFill.fingerprint, color: const Color(0xFF2E5A9E), label: 'nav.attendance'.tr(), onTap: () => context.go(Routes.attendance)),
                _ActionCard(icon: PhosphorIconsFill.calendarX, color: const Color(0xFFE8920C), label: 'nav.leaves'.tr(), onTap: () => context.go(Routes.leaves)),
                _ActionCard(icon: PhosphorIconsFill.receipt, color: const Color(0xFF22A06B), label: 'nav.payslips'.tr(), onTap: () => context.go(Routes.payslips)),
                _ActionCard(icon: PhosphorIconsFill.listChecks, color: const Color(0xFF7C3AED), label: 'nav.approvals'.tr(), onTap: () => context.go(Routes.approvals)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.color, required this.label, required this.onTap});
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, size: 26, color: color),
              ),
              const Spacer(),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}
