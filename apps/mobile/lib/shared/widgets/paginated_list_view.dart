import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/pagination/paged_list_controller.dart';
import 'skeleton.dart';

/// Reusable list for any paginated endpoint (frontend rules #1 & #2):
/// pull-to-refresh, infinite scroll (lazy paging), skeleton on first load,
/// and explicit error / empty states. No auto-refresh.
class PaginatedListView<T> extends StatefulWidget {
  const PaginatedListView({
    super.key,
    required this.state,
    required this.onRefresh,
    required this.onLoadMore,
    required this.itemBuilder,
    this.skeletonCount = 8,
    this.separator,
    this.padding = const EdgeInsets.symmetric(vertical: 8),
  });

  final PagedListState<T> state;
  final Future<void> Function() onRefresh;
  final VoidCallback onLoadMore;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final int skeletonCount;
  final Widget? separator;
  final EdgeInsets padding;

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    // Trigger the next page a little before the very bottom.
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 240) {
      widget.onLoadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;

    // First load → skeleton.
    if (state.isFirstLoad) {
      return ListView.builder(
        padding: widget.padding,
        itemCount: widget.skeletonCount,
        itemBuilder: (_, __) => const SkeletonListTile(),
      );
    }

    // First-load error (no rows yet) → full-screen retry.
    if (state.error != null && state.items.isEmpty) {
      return _CenteredMessage(
        icon: Icons.cloud_off_rounded,
        title: 'common.loadError'.tr(),
        actionLabel: 'common.retry'.tr(),
        onAction: widget.onRefresh,
      );
    }

    if (state.isEmpty) {
      return RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            _CenteredMessage(icon: Icons.inbox_rounded, title: 'common.noData'.tr()),
          ],
        ),
      );
    }

    final itemCount = state.items.length + (state.hasMore || state.isLoadingMore ? 1 : 0);

    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      child: ListView.separated(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: widget.padding,
        itemCount: itemCount,
        separatorBuilder: (_, __) => widget.separator ?? const SizedBox.shrink(),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))),
            );
          }
          return widget.itemBuilder(context, state.items[index]);
        },
      ),
    );
  }
}

class _CenteredMessage extends StatelessWidget {
  const _CenteredMessage({required this.icon, required this.title, this.actionLabel, this.onAction});

  final IconData icon;
  final String title;
  final String? actionLabel;
  final Future<void> Function()? onAction;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurface.withValues(alpha:0.6);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 40, color: muted),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(color: muted)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}
