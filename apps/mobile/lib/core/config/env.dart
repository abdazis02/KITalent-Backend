/// Build-time configuration (PRD §0.11 — never hardcode deployment values).
///
/// Override at build/run time, e.g.:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
///
/// Defaults target the Android emulator (10.0.2.2 → host localhost). For iOS
/// simulator use http://localhost:4000/api; for a physical device, the LAN IP.
class Env {
  const Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api',
  );

  /// Default page size for server-side paginated lists (frontend rule #2).
  static const int pageSize = 20;
}
