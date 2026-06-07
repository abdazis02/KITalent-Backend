import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// The KITalent logo mark (no wordmark). Renders the brand SVG; works on both
/// light and dark backgrounds since the mark carries its own blue + white.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 72, this.withWordmark = false});

  final double size;
  final bool withWordmark;

  @override
  Widget build(BuildContext context) {
    final mark = SvgPicture.asset(
      'assets/logo/logo_mark.svg',
      width: size,
      height: size,
      semanticsLabel: 'KITalent',
    );
    if (!withWordmark) return mark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        const SizedBox(width: 10),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: 'KIT', style: TextStyle(fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.primary)),
              TextSpan(text: 'alent', style: TextStyle(fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
            ],
          ),
          style: TextStyle(fontSize: size * 0.42),
        ),
      ],
    );
  }
}
