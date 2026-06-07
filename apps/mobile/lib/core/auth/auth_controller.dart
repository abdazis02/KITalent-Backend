import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import 'auth_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Authentication state exposed to the router and UI (PRD §10.1).
class AuthState {
  const AuthState(this.status, [this.tokens]);
  const AuthState.unknown() : this(AuthStatus.unknown, null);

  final AuthStatus status;
  final AuthTokens? tokens;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isKnown => status != AuthStatus.unknown;
}

/// Owns the session: bootstrap from secure storage, login/logout, and
/// single-flight token refresh shared with the Dio interceptor.
class AuthController extends Notifier<AuthState> {
  late final AuthStorage _storage;

  /// Bare Dio (no auth interceptor) used only for login/refresh/logout so a
  /// refresh triggered by a 401 can never recurse through the interceptor.
  late final Dio _authDio;

  Future<bool>? _refreshInFlight;

  @override
  AuthState build() {
    _storage = ref.read(authStorageProvider);
    _authDio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    ));
    // Kick off bootstrap; state stays `unknown` until it resolves.
    Future.microtask(_bootstrap);
    return const AuthState.unknown();
  }

  Future<void> _bootstrap() async {
    final tokens = await _storage.read();
    state = tokens == null
        ? const AuthState(AuthStatus.unauthenticated)
        : AuthState(AuthStatus.authenticated, tokens);
  }

  AuthTokens? get tokens => state.tokens;

  Future<void> login({required String email, required String password, String? tenantId}) async {
    final res = await _authDio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password, if (tenantId != null && tenantId.isNotEmpty) 'tenantId': tenantId},
    );
    final body = res.data!;
    final tokens = AuthTokens(
      accessToken: body['accessToken'] as String,
      refreshToken: body['refreshToken'] as String,
      tenantId: tenantId,
    );
    await _storage.write(tokens);
    state = AuthState(AuthStatus.authenticated, tokens);
  }

  Future<void> logout() async {
    final refresh = state.tokens?.refreshToken;
    if (refresh != null) {
      try {
        await _authDio.post('/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {/* best effort */}
    }
    await _storage.clear();
    state = const AuthState(AuthStatus.unauthenticated);
  }

  /// Single-flight refresh — concurrent 401s share one network call.
  Future<bool> refreshSession() {
    return _refreshInFlight ??= _doRefresh().whenComplete(() => _refreshInFlight = null);
  }

  Future<bool> _doRefresh() async {
    final current = state.tokens;
    if (current == null) return false;
    try {
      final res = await _authDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': current.refreshToken},
      );
      final body = res.data!;
      final tokens = AuthTokens(
        accessToken: body['accessToken'] as String,
        refreshToken: body['refreshToken'] as String,
        tenantId: current.tenantId,
      );
      await _storage.write(tokens);
      state = AuthState(AuthStatus.authenticated, tokens);
      return true;
    } catch (_) {
      await _storage.clear();
      state = const AuthState(AuthStatus.unauthenticated);
      return false;
    }
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
