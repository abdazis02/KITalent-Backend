import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/account/me_provider.dart';
import '../../core/network/dio_client.dart';
import 'leaves_screen.dart';

class LeaveType {
  const LeaveType({required this.id, required this.name});
  final String id;
  final String name;
  factory LeaveType.fromJson(Map<String, dynamic> j) => LeaveType(id: j['id'] as String, name: j['name'] as String? ?? '');
}

final leaveTypesProvider = FutureProvider.autoDispose<List<LeaveType>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get<List<dynamic>>('/leaves/types');
  return (res.data ?? const []).cast<Map<String, dynamic>>().map(LeaveType.fromJson).toList();
});

class LeaveRequestScreen extends ConsumerStatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  ConsumerState<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends ConsumerState<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reason = TextEditingController();
  String? _typeId;
  DateTime? _start;
  DateTime? _end;
  bool _submitting = false;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  String _fmt(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _pick({required bool start}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (start ? _start : _end) ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (start) {
          _start = picked;
          if (_end != null && _end!.isBefore(picked)) _end = picked;
        } else {
          _end = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_typeId == null || _start == null || _end == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('leaves.fillAll'.tr())));
      return;
    }
    final employee = ref.read(myEmployeeProvider).valueOrNull;
    if (employee == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('attendance.noProfile'.tr())));
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(dioProvider).post('/leaves', data: {
        'employeeId': employee.id,
        'leaveTypeId': _typeId,
        'startDate': _fmt(_start!),
        'endDate': _fmt(_end!),
        'reason': _reason.text.trim(),
      });
      ref.invalidate(leavesControllerProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('leaves.submitted'.tr())));
        Navigator.of(context).pop(true);
      }
    } on DioException catch (e) {
      final msg = (e.response?.data is Map) ? e.response!.data['message']?.toString() : null;
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg ?? 'common.actionFailed'.tr())));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final types = ref.watch(leaveTypesProvider);

    return Scaffold(
      appBar: AppBar(title: Text('leaves.newRequest'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            types.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => Text('common.loadError'.tr(), style: TextStyle(color: Theme.of(context).colorScheme.error)),
              data: (list) => DropdownButtonFormField<String>(
                initialValue: _typeId,
                decoration: InputDecoration(labelText: 'leaves.type'.tr()),
                items: [for (final t in list) DropdownMenuItem(value: t.id, child: Text(t.name))],
                onChanged: (v) => setState(() => _typeId = v),
                validator: (v) => v == null ? 'leaves.selectType'.tr() : null,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _DateField(label: 'leaves.start'.tr(), value: _start == null ? null : _fmt(_start!), onTap: () => _pick(start: true))),
                const SizedBox(width: 12),
                Expanded(child: _DateField(label: 'leaves.end'.tr(), value: _end == null ? null : _fmt(_end!), onTap: () => _pick(start: false))),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _reason,
              maxLines: 3,
              decoration: InputDecoration(labelText: 'leaves.reason'.tr(), alignLabelWithHint: true),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'leaves.reasonRequired'.tr() : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('leaves.submit'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value, required this.onTap});
  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_today, size: 18)),
        child: Text(value ?? '—'),
      ),
    );
  }
}
