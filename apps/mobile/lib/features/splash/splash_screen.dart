import 'package:flutter/material.dart';

import '../../shared/widgets/app_logo.dart';

/// Shown while the session is restored from secure storage (PRD §10.1).
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppLogo(size: 96),
            const SizedBox(height: 16),
            Text.rich(
              TextSpan(children: [
                TextSpan(text: 'KIT', style: TextStyle(fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.primary)),
                TextSpan(text: 'alent', style: TextStyle(fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
              ]),
              style: const TextStyle(fontSize: 26),
            ),
            const SizedBox(height: 4),
            Text('By Kamunara', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
            const SizedBox(height: 24),
            const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
          ],
        ),
      ),
    );
  }
}
