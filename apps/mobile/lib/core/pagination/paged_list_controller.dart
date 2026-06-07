import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';

/// Immutable state for a server-side paginated list (frontend rule #2).
class PagedListState<T> {
  const PagedListState({
    this.items = const [],
    this.page = 0,
    this.totalPages = 0,
    this.total = 0,
    this.isFirstLoad = true,
    this.isLoadingMore = false,
    this.isRefreshing = false,
    this.error,
  });

  final List<T> items;
  final int page;
  final int totalPages;
  final int total;

  /// True until the first page resolves → render a skeleton, never a spinner-only screen.
  final bool isFirstLoad;
  final bool isLoadingMore;
  final bool isRefreshing;
  final Object? error;

  bool get hasMore => page < totalPages;
  bool get isEmpty => items.isEmpty && !isFirstLoad && error == null;

  PagedListState<T> copyWith({
    List<T>? items,
    int? page,
    int? totalPages,
    int? total,
    bool? isFirstLoad,
    bool? isLoadingMore,
    bool? isRefreshing,
    Object? error,
    bool clearError = false,
  }) {
    return PagedListState<T>(
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      total: total ?? this.total,
      isFirstLoad: isFirstLoad ?? this.isFirstLoad,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Generic controller for a paginated endpoint: lazy page-by-page loading
/// (never fetch-all), debounced server-side search, server-side filters,
/// infinite scroll (`loadMore`) and pull-to-refresh (`refresh`).
class PagedListController<T> extends StateNotifier<PagedListState<T>> {
  PagedListController({
    required Dio dio,
    required String endpoint,
    required T Function(Map<String, dynamic>) fromJson,
    Map<String, String?> filters = const {},
    int pageSize = Env.pageSize,
    String? sortBy,
    String sortOrder = 'desc',
  })  : _dio = dio,
        _endpoint = endpoint,
        _fromJson = fromJson,
        _filters = filters,
        _pageSize = pageSize,
        _sortBy = sortBy,
        _sortOrder = sortOrder,
        super(PagedListState<T>());

  final Dio _dio;
  final String _endpoint;
  final T Function(Map<String, dynamic>) _fromJson;
  Map<String, String?> _filters;
  final int _pageSize;
  final String? _sortBy;
  final String _sortOrder;

  String _search = '';
  Timer? _debounce;
  int _requestId = 0;

  Map<String, dynamic> _query(int page) => {
        'page': page,
        'pageSize': _pageSize,
        'sortOrder': _sortOrder,
        if (_sortBy != null) 'sortBy': _sortBy,
        if (_search.isNotEmpty) 'search': _search,
        for (final e in _filters.entries)
          if (e.value != null && e.value!.isNotEmpty) e.key: e.value,
      };

  /// Load (or reload) the first page.
  Future<void> loadFirst() async {
    final reqId = ++_requestId;
    state = state.copyWith(isFirstLoad: true, clearError: true);
    await _fetch(1, reqId, replace: true);
  }

  /// Pull-to-refresh — keeps current rows visible while the first page reloads.
  Future<void> refresh() async {
    final reqId = ++_requestId;
    state = state.copyWith(isRefreshing: true, clearError: true);
    await _fetch(1, reqId, replace: true);
  }

  /// Infinite scroll — append the next page if there is one.
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.isFirstLoad) return;
    final reqId = ++_requestId;
    state = state.copyWith(isLoadingMore: true);
    await _fetch(state.page + 1, reqId, replace: false);
  }

  /// Debounced server-side search (resets to page 1).
  void setSearch(String value) {
    _search = value.trim();
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), loadFirst);
  }

  /// Replace server-side filters (resets to page 1).
  void setFilters(Map<String, String?> filters) {
    _filters = filters;
    loadFirst();
  }

  Future<void> _fetch(int page, int reqId, {required bool replace}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(_endpoint, queryParameters: _query(page));
      if (reqId != _requestId) return; // a newer request superseded this one
      final body = res.data!;
      final rawList = (body['data'] as List<dynamic>).cast<Map<String, dynamic>>();
      final meta = body['meta'] as Map<String, dynamic>?;
      final fetched = rawList.map(_fromJson).toList();
      state = state.copyWith(
        items: replace ? fetched : [...state.items, ...fetched],
        page: page,
        totalPages: (meta?['totalPages'] as int?) ?? page,
        total: (meta?['total'] as int?) ?? fetched.length,
        isFirstLoad: false,
        isLoadingMore: false,
        isRefreshing: false,
        clearError: true,
      );
    } catch (e) {
      if (reqId != _requestId) return;
      state = state.copyWith(isFirstLoad: false, isLoadingMore: false, isRefreshing: false, error: e);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
