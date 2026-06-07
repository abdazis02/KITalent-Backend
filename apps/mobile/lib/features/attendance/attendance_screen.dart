import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/account/me_provider.dart';
import '../../core/network/dio_client.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  bool _busy = false;

  /// Best-effort current position; null if permission denied or unavailable.
  Future<Position?> _position() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return null;
      return await Geolocator.getCurrentPosition();
    } catch (_) {
      return null;
    }
  }

  Future<void> _punch(String action) async {
    final employee = ref.read(myEmployeeProvider).valueOrNull;
    if (employee == null) {
      _toast('attendance.noProfile'.tr());
      return;
    }
    setState(() => _busy = true);
    try {
      final pos = await _position();
      final dio = ref.read(dioProvider);
      await dio.post('/attendances/$action', data: {
        'employeeId': employee.id,
        if (pos != null) 'lat': pos.latitude,
        if (pos != null) 'lng': pos.longitude,
      });
      _toast(action == 'check-in' ? 'attendance.checkedIn'.tr() : 'attendance.checkedOut'.tr());
    } on DioException catch (e) {
      final msg = (e.response?.data is Map) ? e.response!.data['message']?.toString() : null;
      _toast(msg ?? 'common.actionFailed'.tr());
    } catch (_) {
      _toast('common.actionFailed'.tr());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String msg) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final employee = ref.watch(myEmployeeProvider);

    return Scaffold(
      appBar: AppBar(title: Text('nav.attendance'.tr())),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            Icon(PhosphorIconsFill.fingerprint, size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            employee.when(
              loading: () => const Center(child: Text('…')),
              error: (_, __) => Center(child: Text('attendance.noProfile'.tr())),
              data: (e) => Center(
                child: Text('${e.fullName} · ${e.employeeNo}', style: Theme.of(context).textTheme.titleMedium),
              ),
            ),
            const SizedBox(height: 8),
            Center(child: Text('attendance.hint'.tr(), style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center)),
            const Spacer(),
            FilledButton.icon(
              onPressed: _busy ? null : () => _punch('check-in'),
              icon: const Icon(PhosphorIconsBold.signIn),
              label: Text('attendance.checkIn'.tr()),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _busy ? null : () => _punch('check-out'),
              icon: const Icon(PhosphorIconsBold.signOut),
              label: Text('attendance.checkOut'.tr()),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            ),
            if (_busy) const Padding(padding: EdgeInsets.only(top: 16), child: Center(child: CircularProgressIndicator())),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
