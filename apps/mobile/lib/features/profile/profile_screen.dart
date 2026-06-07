import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/account/me_provider.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/theme/theme_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);
    final themeMode = ref.watch(themeControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text('nav.profile'.tr())),
      body: ListView(
        children: [
          const SizedBox(height: 12),
          me.when(
            loading: () => const ListTile(leading: CircleAvatar(child: Icon(Icons.person)), title: Text('…')),
            error: (_, __) => const ListTile(leading: CircleAvatar(child: Icon(Icons.person)), title: Text('—')),
            data: (u) => ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(u.email, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(u.roles.isEmpty ? '—' : u.roles.join(', ')),
            ),
          ),
          const Divider(),

          // Appearance (PRD §14)
          _SectionLabel('settings.appearance'.tr()),
          RadioGroup<ThemeMode>(
            groupValue: themeMode,
            onChanged: (m) => ref.read(themeControllerProvider.notifier).set(m ?? ThemeMode.system),
            child: Column(
              children: [
                RadioListTile<ThemeMode>(value: ThemeMode.system, title: Text('settings.themeSystem'.tr())),
                RadioListTile<ThemeMode>(value: ThemeMode.light, title: Text('settings.themeLight'.tr())),
                RadioListTile<ThemeMode>(value: ThemeMode.dark, title: Text('settings.themeDark'.tr())),
              ],
            ),
          ),
          const Divider(),

          // Language (PRD §10.34)
          _SectionLabel('settings.language'.tr()),
          RadioGroup<Locale>(
            groupValue: context.locale,
            onChanged: (l) {
              if (l != null) context.setLocale(l);
            },
            child: const Column(
              children: [
                RadioListTile<Locale>(value: Locale('id', 'ID'), title: Text('Bahasa Indonesia')),
                RadioListTile<Locale>(value: Locale('en', 'US'), title: Text('English')),
              ],
            ),
          ),
          const Divider(),

          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: () => ref.read(authControllerProvider.notifier).logout(),
              icon: const Icon(PhosphorIconsBold.signOut),
              label: Text('auth.signOut'.tr()),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                foregroundColor: Theme.of(context).colorScheme.error,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
    );
  }
}
