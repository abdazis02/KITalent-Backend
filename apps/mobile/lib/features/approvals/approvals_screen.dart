import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/network/dio_client.dart';
import '../../shared/widgets/skeleton.dart';

class ApprovalItem {
  const ApprovalItem({required this.id, required this.module, required this.status, required this.currentStepName});

  final String id;
  final String module;
  final String status;
  final String currentStepName;

  factory ApprovalItem.fromJson(Map<String, dynamic> j) {
    final steps = (j['steps'] as List<dynamic>? ?? const []).cast<Map<String, dynamic>>();
    final current = steps.firstWhere(
      (s) => s['status'] == 'pending',
      orElse: () => steps.isNotEmpty ? steps.first : <String, dynamic>{},
    );
    return ApprovalItem(
      id: j['id'] as String,
      module: j['module'] as String? ?? '-',
      status: j['status'] as String? ?? 'pending',
      currentStepName: current['name'] as String? ?? '-',
    );
  }
}

final approvalInboxProvider = FutureProvider.autoDispose<List<ApprovalItem>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get<List<dynamic>>('/approvals/inbox');
  return (res.data ?? const []).cast<Map<String, dynamic>>().map(ApprovalItem.fromJson).toList();
});

class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  Future<void> _act(BuildContext context, WidgetRef ref, ApprovalItem item, String decision) async {
    final dio = ref.read(dioProvider);
    try {
      await dio.post('/approvals/instances/${item.id}/act', data: {'decision': decision});
      ref.invalidate(approvalInboxProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(decision == 'approve' ? 'approvals.approved'.tr() : 'approvals.rejected'.tr())),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('common.actionFailed'.tr())));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inbox = ref.watch(approvalInboxProvider);

    return Scaffold(
      appBar: AppBar(title: Text('nav.approvals'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(approvalInboxProvider.future),
        child: inbox.when(
          loading: () => ListView(children: const [SkeletonListTile(), SkeletonListTile(), SkeletonListTile()]),
          error: (_, __) => _retry(context, () => ref.refresh(approvalInboxProvider.future)),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.28),
                  Center(child: Text('approvals.empty'.tr(), style: TextStyle(color: Theme.of(context).hintColor))),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final item = items[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.module.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('approvals.step'.tr(args: [item.currentStepName]), style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => _act(context, ref, item, 'reject'),
                              icon: const Icon(PhosphorIconsBold.x, size: 18),
                              label: Text('approvals.reject'.tr()),
                              style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
                            ),
                            const SizedBox(width: 8),
                            FilledButton.icon(
                              onPressed: () => _act(context, ref, item, 'approve'),
                              icon: const Icon(PhosphorIconsBold.check, size: 18),
                              label: Text('approvals.approve'.tr()),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _retry(BuildContext context, Future<void> Function() onRetry) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.28),
        Center(
          child: Column(
            children: [
              Text('common.loadError'.tr()),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: Text('common.retry'.tr())),
            ],
          ),
        ),
      ],
    );
  }
}
