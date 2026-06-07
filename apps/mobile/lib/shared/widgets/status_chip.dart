import 'package:flutter/material.dart';

/// Small colored status pill used across lists (leave/approval/payslip states).
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (bg, fg) = _tone(scheme);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  (Color, Color) _tone(ColorScheme scheme) {
    switch (status) {
      case 'approved':
      case 'active':
      case 'paid':
      case 'published':
        return (Colors.green.withValues(alpha:0.15), Colors.green.shade700);
      case 'rejected':
      case 'cancelled':
      case 'terminated':
        return (scheme.error.withValues(alpha:0.15), scheme.error);
      case 'waiting_approval':
      case 'submitted':
      case 'pending':
        return (Colors.orange.withValues(alpha:0.15), Colors.orange.shade800);
      default:
        return (scheme.onSurface.withValues(alpha:0.08), scheme.onSurface.withValues(alpha:0.7));
    }
  }
}
