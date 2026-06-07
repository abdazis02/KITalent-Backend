import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_client.dart';
import '../../core/pagination/paged_list_controller.dart';
import '../../shared/widgets/paginated_list_view.dart';
import '../../shared/widgets/status_chip.dart';

class LeaveItem {
  const LeaveItem({required this.id, required this.startDate, required this.endDate, required this.totalDays, required this.status, this.reason});

  final String id;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String status;
  final String? reason;

  factory LeaveItem.fromJson(Map<String, dynamic> j) => LeaveItem(
        id: j['id'] as String,
        startDate: (j['startDate'] as String? ?? '').split('T').first,
        endDate: (j['endDate'] as String? ?? '').split('T').first,
        totalDays: (j['totalDays'] as num?)?.toInt() ?? 0,
        status: j['status'] as String? ?? 'submitted',
        reason: j['reason'] as String?,
      );
}

final leavesControllerProvider =
    StateNotifierProvider.autoDispose<PagedListController<LeaveItem>, PagedListState<LeaveItem>>((ref) {
  return PagedListController<LeaveItem>(
    dio: ref.watch(dioProvider),
    endpoint: '/leaves',
    fromJson: LeaveItem.fromJson,
    sortBy: 'createdAt',
  )..loadFirst();
});

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leavesControllerProvider);
    final controller = ref.read(leavesControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text('nav.leaves'.tr())),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: TextField(
              onChanged: controller.setSearch,
              decoration: InputDecoration(
                isDense: true,
                hintText: 'common.search'.tr(),
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          Expanded(
            child: PaginatedListView<LeaveItem>(
              state: state,
              onRefresh: controller.refresh,
              onLoadMore: controller.loadMore,
              itemBuilder: (context, item) => ListTile(
                title: Text('${item.startDate} → ${item.endDate}'),
                subtitle: Text('leaves.days'.tr(args: ['${item.totalDays}'])),
                trailing: StatusChip(status: item.status),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
