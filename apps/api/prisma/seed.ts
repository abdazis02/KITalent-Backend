/**
 * Seed: RBAC vocabulary + a demo tenant and admin user so the stack runs
 * end-to-end. Permissions/roles are DATA (PRD §0.4, §9) — extend here, never
 * hardcode them into guards. Idempotent: safe to re-run.
 *
 *   pnpm --filter @kitalent/api db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  PERMISSION_SCOPES,
  buildPermission,
} from '@kitalent/types';

const prisma = new PrismaClient();

// A curated, sensible subset of action×scope per module (the full cartesian
// product is huge; seed what the app actually uses and grow over time).
const SEED_MATRIX: Array<{ modules: readonly string[]; actions: string[]; scopes: string[] }> = [
  {
    modules: PERMISSION_MODULES,
    actions: ['read'],
    scopes: ['own', 'tenant', 'all'],
  },
  {
    modules: [
      'employee', 'client', 'attendance', 'leave', 'overtime', 'payroll',
      'invoice', 'contract', 'placement', 'document', 'reimbursement', 'shift', 'loan',
      'recruitment', 'candidate', 'performance', 'incident', 'notification',
      'asset', 'training', 'tenant', 'company', 'organization', 'service',
      'manpowerRequest', 'fingerprint', 'approval', 'schedule', 'permission',
      'subscription', 'settings',
    ],
    actions: ['create', 'update', 'delete', 'export'],
    scopes: ['tenant'],
  },
  {
    modules: ['payroll', 'invoice', 'contract', 'leave', 'overtime', 'reimbursement', 'manpowerRequest', 'placement', 'loan', 'performance', 'approval', 'attendance', 'permission'],
    actions: ['approve', 'reject'],
    scopes: ['tenant'],
  },
  {
    modules: ['payroll', 'invoice', 'recruitment'],
    actions: ['process'],
    scopes: ['tenant'],
  },
  {
    modules: ['fingerprint', 'attendance'],
    actions: ['sync'],
    scopes: ['tenant'],
  },
  {
    // "generate" produces a document/artifact (invoice, slip, report) from data.
    modules: ['payroll', 'invoice', 'contract', 'salarySlip', 'report', 'document'],
    actions: ['generate'],
    scopes: ['tenant'],
  },
];

// Special permissions outside the module.action.scope matrix.
const EXTRA_PERMISSIONS = ['employee.read.sensitive'];

async function seedPermissions(): Promise<string[]> {
  const keys = new Set<string>();
  for (const group of SEED_MATRIX) {
    for (const m of group.modules) {
      for (const a of group.actions) {
        for (const s of group.scopes) {
          if (!(PERMISSION_ACTIONS as readonly string[]).includes(a)) continue;
          if (!(PERMISSION_SCOPES as readonly string[]).includes(s)) continue;
          keys.add(buildPermission(m as never, a as never, s as never));
        }
      }
    }
  }
  for (const key of EXTRA_PERMISSIONS) keys.add(key);

  for (const key of keys) {
    const [module, action, scope] = key.split('.');
    await prisma.permission.upsert({
      where: { key },
      create: { key, module, action, scope },
      update: {},
    });
  }
  console.log(`✓ ${keys.size} permissions`);
  return [...keys];
}

async function seedRole(key: string, level: 'platform' | 'operator' | 'client' | 'company', permissionKeys: string[]) {
  // System roles have a null tenantId, which Prisma cannot express in a compound
  // unique `where`; find-then-create instead of upsert.
  const role =
    (await prisma.role.findFirst({ where: { tenantId: null, key } })) ??
    (await prisma.role.create({ data: { key, level, isSystem: true } }));

  const perms = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  for (const p of perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
      create: { roleId: role.id, permissionId: p.id },
      update: {},
    });
  }
  return role;
}

// ---- Default platform plans (PRD §17.2 / §27) ------------------------------
const PLANS = [
  { code: 'starter', name: 'Starter', priceMonthly: 0, priceYearly: 0, employeeLimit: 25, storageLimitMb: 1024 },
  { code: 'professional', name: 'Professional', priceMonthly: 990_000, priceYearly: 9_900_000, employeeLimit: 250, storageLimitMb: 10_240 },
  { code: 'enterprise', name: 'Enterprise', priceMonthly: 4_990_000, priceYearly: 49_900_000, employeeLimit: 5000, storageLimitMb: 102_400 },
  { code: 'custom', name: 'Custom', priceMonthly: 0, priceYearly: 0, employeeLimit: 0, storageLimitMb: 0 },
];

async function seedPlans() {
  for (const p of PLANS) {
    await prisma.plan.upsert({ where: { code: p.code }, create: p, update: { name: p.name, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, employeeLimit: p.employeeLimit, storageLimitMb: p.storageLimitMb } });
  }
  console.log(`✓ ${PLANS.length} subscription plans`);
}

// ---- System notification templates (PRD §17.15 / §27) ----------------------
const NOTIF_TEMPLATES = [
  { code: 'leave.approval.pending', channel: 'in_app', subject: 'Persetujuan cuti', body: 'Ada pengajuan cuti yang menunggu persetujuan Anda.' },
  { code: 'leave.approved', channel: 'in_app', subject: 'Cuti disetujui', body: 'Pengajuan cuti Anda telah disetujui.' },
  { code: 'leave.rejected', channel: 'in_app', subject: 'Cuti ditolak', body: 'Pengajuan cuti Anda ditolak.' },
  { code: 'overtime.approval.pending', channel: 'in_app', subject: 'Persetujuan lembur', body: 'Ada pengajuan lembur yang menunggu persetujuan Anda.' },
  { code: 'reimbursement.approval.pending', channel: 'in_app', subject: 'Persetujuan reimbursement', body: 'Ada pengajuan reimbursement menunggu persetujuan Anda.' },
  { code: 'payroll.approval.pending', channel: 'in_app', subject: 'Persetujuan payroll', body: 'Run payroll menunggu persetujuan Anda.' },
  { code: 'invoice.approval.pending', channel: 'in_app', subject: 'Persetujuan invoice', body: 'Invoice menunggu persetujuan Anda.' },
  { code: 'contract.expiring', channel: 'in_app', subject: 'Kontrak akan berakhir', body: 'Sebuah kontrak akan berakhir dalam 30 hari.' },
];

async function seedNotificationTemplates() {
  for (const t of NOTIF_TEMPLATES) {
    // System templates have tenantId null; the table has no compound unique, so find-then-create.
    const existing = await prisma.notificationTemplate.findFirst({ where: { tenantId: null, code: t.code, channel: t.channel } });
    if (existing) await prisma.notificationTemplate.update({ where: { id: existing.id }, data: { subject: t.subject, body: t.body } });
    else await prisma.notificationTemplate.create({ data: { tenantId: null, ...t } });
  }
  console.log(`✓ ${NOTIF_TEMPLATES.length} system notification templates`);
}

// ---- Default approval workflows for a tenant (PRD §10.27 / §27) -------------
// Two-tier "berjenjang": direct supervisor → HR; finance modules add a finance tier.
const DEFAULT_WORKFLOWS: Array<{ module: string; name: string; steps: Array<{ stepOrder: number; name: string; approverType: string; approverRoleKey?: string; minAmount?: number }> }> = [
  { module: 'leave', name: 'Persetujuan Cuti (default)', steps: [
    { stepOrder: 1, name: 'Atasan Langsung', approverType: 'supervisor' },
    { stepOrder: 2, name: 'HR', approverType: 'hr', approverRoleKey: 'hr_manager' },
  ] },
  { module: 'overtime', name: 'Persetujuan Lembur (default)', steps: [
    { stepOrder: 1, name: 'Atasan Langsung', approverType: 'supervisor' },
  ] },
  { module: 'reimbursement', name: 'Persetujuan Reimbursement (default)', steps: [
    { stepOrder: 1, name: 'Atasan Langsung', approverType: 'supervisor' },
    { stepOrder: 2, name: 'Finance (>= 1jt)', approverType: 'finance', approverRoleKey: 'finance_manager', minAmount: 1_000_000 },
  ] },
];

async function seedDefaultWorkflows(tenantId: string, createdBy: string) {
  let created = 0;
  for (const wf of DEFAULT_WORKFLOWS) {
    // Skip if an active workflow with steps already exists for this module.
    const existing = await prisma.approvalWorkflow.findFirst({ where: { tenantId, module: wf.module, deletedAt: null, stepTemplates: { some: {} } }, select: { id: true } });
    if (existing) continue;
    await prisma.approvalWorkflow.create({
      data: {
        tenantId, module: wf.module, name: wf.name, isActive: true, createdBy,
        stepTemplates: { create: wf.steps.map((s) => ({ tenantId, stepOrder: s.stepOrder, name: s.name, approverType: s.approverType as never, approverRoleKey: s.approverRoleKey, minAmount: s.minAmount ?? 0, isRequired: true })) },
      },
    });
    created += 1;
  }
  console.log(`✓ ${created} default approval workflows (${DEFAULT_WORKFLOWS.length - created} already present)`);
}

async function main() {
  const allPermissionKeys = await seedPermissions();

  // Platform super admin gets everything.
  const superAdmin = await seedRole('super_admin_platform', 'platform', allPermissionKeys);

  // Operator HR manager: a representative scoped role.
  await seedRole(
    'hr_manager',
    'operator',
    allPermissionKeys.filter((k) =>
      ['employee', 'attendance', 'leave', 'overtime', 'contract', 'document', 'placement'].some((m) =>
        k.startsWith(`${m}.`),
      ),
    ),
  );

  // Demo tenant (hybrid) + admin user.
  const tenant = await prisma.tenant.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'PT Kamunara Group International',
      legalName: 'PT Kamunara Group International',
      mode: 'hybrid',
      status: 'active',
      plan: 'enterprise',
      defaultLocale: 'id-ID',
      defaultTheme: 'system',
    },
    update: {},
  });

  const passwordHash = await argon2.hash('Password123');
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@kitalent.app' } },
    create: {
      tenantId: tenant.id,
      email: 'admin@kitalent.app',
      fullName: 'KITalent Admin',
      passwordHash,
      preference: { create: { locale: 'id-ID', theme: 'system' } },
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    create: { userId: admin.id, roleId: superAdmin.id },
    update: {},
  });

  // Demo domain data so attendance/leave endpoints are exercisable.
  const employee = await prisma.employee.upsert({
    where: { tenantId_employeeNo: { tenantId: tenant.id, employeeNo: 'EMP-0001' } },
    create: {
      tenantId: tenant.id,
      employeeNo: 'EMP-0001',
      fullName: 'Budi Santoso',
      status: 'active',
      email: 'budi@kitalent.app',
      createdBy: admin.id,
    },
    update: {},
  });

  await prisma.leaveType.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'ANNUAL' } },
    create: { tenantId: tenant.id, code: 'ANNUAL', name: 'Cuti Tahunan', isPaid: true, defaultQuota: 12 },
    update: {},
  });

  // Platform/default catalog + this tenant's default approval workflows (§27).
  await seedPlans();
  await seedNotificationTemplates();
  await seedDefaultWorkflows(tenant.id, admin.id);

  console.log('✓ Demo tenant + admin@kitalent.app / Password123');
  console.log(`✓ Demo employee ${employee.employeeNo} + ANNUAL leave type`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
