import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Token bundle persisted securely on the device (PRD §10.1).
class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken, this.tenantId});

  final String accessToken;
  final String refreshToken;
  final String? tenantId;
}

/// Secure (Keychain/Keystore-backed) storage for auth tokens.
class AuthStorage {
  AuthStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _kAccess = 'kitalent.accessToken';
  static const _kRefresh = 'kitalent.refreshToken';
  static const _kTenant = 'kitalent.tenantId';

  Future<AuthTokens?> read() async {
    final access = await _storage.read(key: _kAccess);
    final refresh = await _storage.read(key: _kRefresh);
    if (access == null || refresh == null) return null;
    return AuthTokens(
      accessToken: access,
      refreshToken: refresh,
      tenantId: await _storage.read(key: _kTenant),
    );
  }

  Future<void> write(AuthTokens tokens) async {
    await _storage.write(key: _kAccess, value: tokens.accessToken);
    await _storage.write(key: _kRefresh, value: tokens.refreshToken);
    if (tokens.tenantId != null) {
      await _storage.write(key: _kTenant, value: tokens.tenantId);
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
    await _storage.delete(key: _kTenant);
  }
}

final authStorageProvider = Provider<AuthStorage>((ref) => AuthStorage());
