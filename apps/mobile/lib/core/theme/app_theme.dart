import 'package:flutter/material.dart';

/// KITalent Flutter theme — Light & Dark (PRD §14).
///
/// These colors mirror the semantic design tokens in
/// `packages/design-tokens/src/tokens.css`. Flutter can't read CSS variables,
/// so the two platforms share one *vocabulary* maintained in parallel. Keep
/// these values in sync with tokens.css when the palette changes.
class AppColors {
  // Brand
  static const Color primaryLight = Color(0xFF4F46E5); // ~ hsl(245 75% 59%)
  static const Color primaryDark = Color(0xFF818CF8); // ~ hsl(243 86% 71%)
  static const Color accentLight = Color(0xFFE8920C);
  static const Color accentDark = Color(0xFFFBB040);

  // Surfaces
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color backgroundDark = Color(0xFF0B1120);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF111827);

  // Feedback
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF0EA5E9);
}

class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: isDark ? AppColors.primaryDark : AppColors.primaryLight,
      brightness: brightness,
      primary: isDark ? AppColors.primaryDark : AppColors.primaryLight,
      surface: isDark ? AppColors.cardDark : AppColors.cardLight,
      error: AppColors.danger,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? AppColors.cardDark : AppColors.cardLight,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: false,
      ),
    );
  }
}
