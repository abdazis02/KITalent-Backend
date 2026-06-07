import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Persists the user's theme choice (system/light/dark) to local storage and
/// exposes it as Flutter's [ThemeMode] (PRD §14: stored locally, synced to
/// backend `user_preferences` on login).
class ThemeController extends StateNotifier<ThemeMode> {
  ThemeController(this._prefs) : super(_read(_prefs));

  static const _key = 'kitalent.theme';
  final SharedPreferences _prefs;

  static ThemeMode _read(SharedPreferences prefs) {
    switch (prefs.getString(_key)) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> set(ThemeMode mode) async {
    state = mode;
    await _prefs.setString(_key, mode.name);
  }
}

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('Override in main() after async init'),
);

final themeControllerProvider =
    StateNotifierProvider<ThemeController, ThemeMode>((ref) {
  return ThemeController(ref.watch(sharedPreferencesProvider));
});
