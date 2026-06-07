import type { PayrollComponentType } from '@prisma/client';

/**
 * Pure payroll calculation — kept side-effect free so it is unit-testable and
 * the formula stays auditable (PRD §10.17: formulas configurable, no magic in
 * controllers). All amounts are whole IDR.
 *
 * Net categorisation by component type:
 *   additions  (paid to employee): earning, benefit, reimbursement, adjustment
 *   deductions (withheld):         deduction, tax, employee_contribution, loan
 *   excluded from net (employer cost, recorded for reporting): employer_contribution
 */
const ADDITION_TYPES: PayrollComponentType[] = ['earning', 'benefit', 'reimbursement', 'adjustment'];
const DEDUCTION_TYPES: PayrollComponentType[] = ['deduction', 'tax', 'employee_contribution', 'loan'];

/** Working days per month used to derive a daily rate for absence deduction. */
export const WORKING_DAYS_PER_MONTH = 22;

/**
 * Overtime base — Indonesian convention: hourly rate = monthly salary / 173,
 * paid at a flat 1.5× here (configurable per tenant in a later iteration; the
 * real regulation tiers 1.5× first hour then 2× thereafter).
 */
export const OVERTIME_HOURLY_DIVISOR = 173;
export const OVERTIME_MULTIPLIER = 1.5;

export interface ComponentInput {
  code: string;
  name: string;
  type: PayrollComponentType;
  amount: number;
}

export interface PayslipComputation {
  basicSalary: number;
  presentDays: number;
  absentDays: number;
  overtimeMinutes: number;
  totalEarning: number;
  totalDeduction: number;
  netSalary: number;
  lines: ComponentInput[];
}

export function computePayslip(params: {
  basicSalary: number;
  items: ComponentInput[];
  presentDays: number;
  absentDays: number;
  overtimeMinutes?: number;
}): PayslipComputation {
  const { basicSalary, items, presentDays, absentDays } = params;
  const overtimeMinutes = params.overtimeMinutes ?? 0;
  const lines: ComponentInput[] = [];

  // Basic salary is always the first earning line.
  lines.push({ code: 'BASIC', name: 'Gaji Pokok', type: 'earning', amount: basicSalary });

  for (const item of items) lines.push(item);

  // Overtime integration: approved overtime hours × hourly rate × multiplier.
  if (overtimeMinutes > 0 && basicSalary > 0) {
    const hourlyRate = basicSalary / OVERTIME_HOURLY_DIVISOR;
    const overtimePay = Math.round((hourlyRate * overtimeMinutes / 60) * OVERTIME_MULTIPLIER);
    lines.push({ code: 'OVERTIME', name: 'Upah Lembur', type: 'earning', amount: overtimePay });
  }

  // Attendance integration: deduct a pro-rated daily rate per absent day.
  if (absentDays > 0 && basicSalary > 0) {
    const dailyRate = Math.round(basicSalary / WORKING_DAYS_PER_MONTH);
    lines.push({
      code: 'ABSENCE',
      name: 'Potongan Ketidakhadiran',
      type: 'deduction',
      amount: dailyRate * absentDays,
    });
  }

  let totalEarning = 0;
  let totalDeduction = 0;
  for (const line of lines) {
    if (ADDITION_TYPES.includes(line.type)) totalEarning += line.amount;
    else if (DEDUCTION_TYPES.includes(line.type)) totalDeduction += line.amount;
    // employer_contribution: recorded but excluded from net.
  }

  return {
    basicSalary,
    presentDays,
    absentDays,
    overtimeMinutes,
    totalEarning,
    totalDeduction,
    netSalary: totalEarning - totalDeduction,
    lines,
  };
}
