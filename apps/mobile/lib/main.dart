import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      // Locale switching (PRD §13): id-ID default, en-US fallback. Persisted by
      // easy_localization; synced to backend user_preferences on login.
      child: EasyLocalization(
        supportedLocales: const [Locale('id', 'ID'), Locale('en', 'US')],
        path: 'assets/translations',
        fallbackLocale: const Locale('id', 'ID'),
        startLocale: const Locale('id', 'ID'),
        child: const KITalentApp(),
      ),
    ),
  );
}

class KITalentApp extends ConsumerWidget {
  const KITalentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);

    return MaterialApp(
      title: 'KITalent',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      home: const _LoginScreen(),
    );
  }
}

/// Placeholder login screen demonstrating tokens + i18n wired end-to-end.
class _LoginScreen extends StatelessWidget {
  const _LoginScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'auth.signInTitle'.tr(),
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {},
                child: Text('auth.signIn'.tr()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
