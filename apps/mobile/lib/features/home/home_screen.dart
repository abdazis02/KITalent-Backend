import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/account/me_provider.dart';
import '../../core/router/app_router.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);

    return Scaffold(
      appBar: AppBar(title: Text('nav.home'.tr())),
      body: RefreshIndicator(
        // Manual refresh (rule #1) — pull down to refetch.
        onRefresh: () => ref.refresh(meProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            me.when(
              loading: () => const _GreetingSkeleton(),
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
            Text('home.quickActions'.tr(), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _ActionCard(icon: Icons.fingerprint, label: 'nav.attendance'.tr(), onTap: () => context.go(Routes.attendance)),
                _ActionCard(icon: Icons.event_busy, label: 'nav.leaves'.tr(), onTap: () => context.go(Routes.leaves)),
                _ActionCard(icon: Icons.receipt_long, label: 'nav.payslips'.tr(), onTap: () => context.go(Routes.payslips)),
                _ActionCard(icon: Icons.checklist, label: 'nav.approvals'.tr(), onTap: () => context.go(Routes.approvals)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 28, color: Theme.of(context).colorScheme.primary),
              const Spacer(),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _GreetingSkeleton extends StatelessWidget {
  const _GreetingSkeleton();
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text('home.greeting'.tr(), style: Theme.of(context).textTheme.titleLarge),
    );
  }
}
