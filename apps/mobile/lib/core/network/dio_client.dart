import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';
import '../config/env.dart';

/// Authenticated Dio for all data requests. Attaches the bearer token and
/// tenant header, and transparently refreshes once on 401 then retries
/// (PRD §10.1). Auth endpoints use a separate bare Dio in [AuthController].
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      final tokens = ref.read(authControllerProvider).tokens;
      if (tokens != null) {
        options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
        if (tokens.tenantId != null) options.headers['x-tenant-id'] = tokens.tenantId;
      }
      handler.next(options);
    },
    onError: (error, handler) async {
      final response = error.response;
      final isAuthError = response?.statusCode == 401;
      final alreadyRetried = error.requestOptions.extra['__retried'] == true;

      if (isAuthError && !alreadyRetried) {
        final refreshed = await ref.read(authControllerProvider.notifier).refreshSession();
        if (refreshed) {
          final tokens = ref.read(authControllerProvider).tokens!;
          final opts = error.requestOptions
            ..extra['__retried'] = true
            ..headers['Authorization'] = 'Bearer ${tokens.accessToken}';
          try {
            final retry = await dio.fetch<dynamic>(opts);
            return handler.resolve(retry);
          } catch (e) {
            if (e is DioException) return handler.next(e);
          }
        }
      }
      handler.next(error);
    },
  ));

  return dio;
});
