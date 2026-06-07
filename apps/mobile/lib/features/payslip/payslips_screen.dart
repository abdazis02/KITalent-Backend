import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/network/dio_client.dart';
import '../../shared/widgets/skeleton.dart';
import '../../shared/widgets/status_chip.dart';

class PayslipItem {
  const PayslipItem({required this.id, required this.period, required this.status, required this.netSalary});

  final String id;
  final String period;
  final String status;
  final int netSalary;

  factory PayslipItem.fromJson(Map<String, dynamic> j) => PayslipItem(
        id: j['id'] as String,
        period: j['period'] as String? ?? '-',
        status: j['status'] as String? ?? 'published',
        netSalary: (j['netSalary'] as num?)?.toInt() ?? 0,
      );
}

/// Bounded self-service list (/salary-slips/me returns an array, not paginated).
final payslipsProvider = FutureProvider.autoDispose<List<PayslipItem>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get<List<dynamic>>('/salary-slips/me');
  return (res.data ?? const []).cast<Map<String, dynamic>>().map(PayslipItem.fromJson).toList();
});

class PayslipsScreen extends ConsumerWidget {
  const PayslipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slips = ref.watch(payslipsProvider);
    final rupiah = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(title: Text('nav.payslips'.tr())),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(payslipsProvider.future),
        child: slips.when(
          loading: () => ListView(children: const [SkeletonListTile(), SkeletonListTile(), SkeletonListTile()]),
          error: (e, _) => _error(context, () => ref.refresh(payslipsProvider.future)),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(child: Text('common.noData'.tr(), style: TextStyle(color: Theme.of(context).hintColor))),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final s = items[i];
                return ListTile(
                  leading: const CircleAvatar(child: Icon(PhosphorIconsFill.receipt)),
                  title: Text(s.period, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(rupiah.format(s.netSalary)),
                  trailing: StatusChip(status: s.status),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _error(BuildContext context, Future<void> Function() onRetry) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.28),
        Center(
          child: Column(
            children: [
              Icon(Icons.cloud_off_rounded, size: 40, color: Theme.of(context).hintColor),
              const SizedBox(height: 12),
              Text('common.loadError'.tr()),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: Text('common.retry'.tr())),
            ],
          ),
        ),
      ],
    );
  }
}
