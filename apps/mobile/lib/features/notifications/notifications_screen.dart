import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/network/dio_client.dart';
import '../../core/pagination/paged_list_controller.dart';
import '../../shared/widgets/paginated_list_view.dart';

class NotificationItem {
  const NotificationItem({required this.id, required this.title, this.body, this.read = false});
  final String id;
  final String title;
  final String? body;
  final bool read;

  factory NotificationItem.fromJson(Map<String, dynamic> j) => NotificationItem(
        id: j['id'] as String,
        title: j['title'] as String? ?? '',
        body: j['body'] as String?,
        read: j['readAt'] != null,
      );
}

final notificationsControllerProvider =
    StateNotifierProvider.autoDispose<PagedListController<NotificationItem>, PagedListState<NotificationItem>>((ref) {
  return PagedListController<NotificationItem>(
    dio: ref.watch(dioProvider),
    endpoint: '/notifications',
    fromJson: NotificationItem.fromJson,
  )..loadFirst();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsControllerProvider);
    final controller = ref.read(notificationsControllerProvider.notifier);
    final dio = ref.read(dioProvider);

    Future<void> markAll() async {
      try {
        await dio.post('/notifications/read-all');
        await controller.refresh();
      } catch (_) {/* ignore */}
    }

    Future<void> markRead(NotificationItem n) async {
      if (n.read) return;
      try {
        await dio.post('/notifications/${n.id}/read');
        await controller.refresh();
      } catch (_) {/* ignore */}
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('notifications.title'.tr()),
        actions: [
          TextButton(onPressed: markAll, child: Text('notifications.markAll'.tr())),
        ],
      ),
      body: PaginatedListView<NotificationItem>(
        state: state,
        onRefresh: controller.refresh,
        onLoadMore: controller.loadMore,
        itemBuilder: (context, n) => ListTile(
          leading: Icon(
            n.read ? PhosphorIconsRegular.bell : PhosphorIconsFill.bellRinging,
            color: n.read ? Theme.of(context).hintColor : Theme.of(context).colorScheme.primary,
          ),
          title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.w400 : FontWeight.w700)),
          subtitle: n.body == null ? null : Text(n.body!),
          trailing: n.read ? null : Container(width: 8, height: 8, decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, shape: BoxShape.circle)),
          onTap: () => markRead(n),
        ),
      ),
    );
  }
}
