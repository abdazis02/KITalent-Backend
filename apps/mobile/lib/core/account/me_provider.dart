import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/dio_client.dart';

/// The authenticated user (PRD §10.1 /auth/me) — id, email, roles, permissions.
class MeUser {
  const MeUser({required this.id, required this.email, required this.roles, required this.permissions, this.tenantId});

  final String id;
  final String email;
  final List<String> roles;
  final List<String> permissions;
  final String? tenantId;

  bool can(String permission) => permissions.contains(permission);

  factory MeUser.fromJson(Map<String, dynamic> json) => MeUser(
        id: json['id'] as String,
        email: json['email'] as String? ?? '',
        tenantId: json['tenantId'] as String?,
        roles: ((json['roles'] as List<dynamic>?) ?? const []).map((e) => e.toString()).toList(),
        permissions: ((json['permissions'] as List<dynamic>?) ?? const []).map((e) => e.toString()).toList(),
      );
}

final meProvider = FutureProvider.autoDispose<MeUser>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get<Map<String, dynamic>>('/auth/me');
  return MeUser.fromJson(res.data!);
});

/// The employee record linked to the signed-in user (PRD §10.30 /employees/me).
class MyEmployee {
  const MyEmployee({required this.id, required this.employeeNo, required this.fullName, this.status});

  final String id;
  final String employeeNo;
  final String fullName;
  final String? status;

  factory MyEmployee.fromJson(Map<String, dynamic> j) => MyEmployee(
        id: j['id'] as String,
        employeeNo: j['employeeNo'] as String? ?? '',
        fullName: j['fullName'] as String? ?? '',
        status: j['status'] as String?,
      );
}

final myEmployeeProvider = FutureProvider.autoDispose<MyEmployee>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get<Map<String, dynamic>>('/employees/me');
  return MyEmployee.fromJson(res.data!);
});
