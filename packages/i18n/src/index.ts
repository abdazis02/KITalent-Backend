import { DEFAULT_LOCALE, LOCALES, type Locale } from '@kitalent/types';

import idCommon from './locales/id-ID/common.json';
import idAuth from './locales/id-ID/auth.json';
import idNavigation from './locales/id-ID/navigation.json';
import idAttendance from './locales/id-ID/attendance.json';
import idSettings from './locales/id-ID/settings.json';
import idValidation from './locales/id-ID/validation.json';
import idPayroll from './locales/id-ID/payroll.json';
import idInvoice from './locales/id-ID/invoice.json';
import idOvertime from './locales/id-ID/overtime.json';
import idSchedule from './locales/id-ID/schedule.json';
import idContract from './locales/id-ID/contract.json';
import idPlacement from './locales/id-ID/placement.json';
import idReimbursement from './locales/id-ID/reimbursement.json';
import idLoan from './locales/id-ID/loan.json';
import idRecruitment from './locales/id-ID/recruitment.json';
import idCandidate from './locales/id-ID/candidate.json';
import idPerformance from './locales/id-ID/performance.json';
import idIncident from './locales/id-ID/incident.json';
import idDocument from './locales/id-ID/document.json';
import idNotification from './locales/id-ID/notification.json';
import idAsset from './locales/id-ID/asset.json';
import idTraining from './locales/id-ID/training.json';
import idCompany from './locales/id-ID/company.json';
import idOrganization from './locales/id-ID/organization.json';
import idTenant from './locales/id-ID/tenant.json';
import idApproval from './locales/id-ID/approval.json';

import enCommon from './locales/en-US/common.json';
import enAuth from './locales/en-US/auth.json';
import enNavigation from './locales/en-US/navigation.json';
import enAttendance from './locales/en-US/attendance.json';
import enSettings from './locales/en-US/settings.json';
import enValidation from './locales/en-US/validation.json';
import enPayroll from './locales/en-US/payroll.json';
import enInvoice from './locales/en-US/invoice.json';
import enOvertime from './locales/en-US/overtime.json';
import enSchedule from './locales/en-US/schedule.json';
import enContract from './locales/en-US/contract.json';
import enPlacement from './locales/en-US/placement.json';
import enReimbursement from './locales/en-US/reimbursement.json';
import enLoan from './locales/en-US/loan.json';
import enRecruitment from './locales/en-US/recruitment.json';
import enCandidate from './locales/en-US/candidate.json';
import enPerformance from './locales/en-US/performance.json';
import enIncident from './locales/en-US/incident.json';
import enDocument from './locales/en-US/document.json';
import enNotification from './locales/en-US/notification.json';
import enAsset from './locales/en-US/asset.json';
import enTraining from './locales/en-US/training.json';
import enCompany from './locales/en-US/company.json';
import enOrganization from './locales/en-US/organization.json';
import enTenant from './locales/en-US/tenant.json';
import enApproval from './locales/en-US/approval.json';

export { NAMESPACES, type Namespace } from './namespaces';
export { LOCALES, DEFAULT_LOCALE, type Locale } from '@kitalent/types';

type Messages = Record<string, Record<string, unknown>>;

/**
 * Assembled message catalogs. Namespaces are added here as their JSON files are
 * authored. The parity checker enforces that every namespace present in id-ID
 * also exists in en-US with the same key set.
 */
const messages: Record<Locale, Messages> = {
  'id-ID': {
    common: idCommon,
    auth: idAuth,
    navigation: idNavigation,
    attendance: idAttendance,
    settings: idSettings,
    validation: idValidation,
    payroll: idPayroll,
    invoice: idInvoice,
    overtime: idOvertime,
    schedule: idSchedule,
    contract: idContract,
    placement: idPlacement,
    reimbursement: idReimbursement,
    loan: idLoan,
    recruitment: idRecruitment,
    candidate: idCandidate,
    performance: idPerformance,
    incident: idIncident,
    document: idDocument,
    notification: idNotification,
    asset: idAsset,
    training: idTraining,
    company: idCompany,
    organization: idOrganization,
    tenant: idTenant,
    approval: idApproval,
  },
  'en-US': {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    attendance: enAttendance,
    settings: enSettings,
    validation: enValidation,
    payroll: enPayroll,
    invoice: enInvoice,
    overtime: enOvertime,
    schedule: enSchedule,
    contract: enContract,
    placement: enPlacement,
    reimbursement: enReimbursement,
    loan: enLoan,
    recruitment: enRecruitment,
    candidate: enCandidate,
    performance: enPerformance,
    incident: enIncident,
    document: enDocument,
    notification: enNotification,
    asset: enAsset,
    training: enTraining,
    company: enCompany,
    organization: enOrganization,
    tenant: enTenant,
    approval: enApproval,
  },
};

export function getMessages(locale: string): Messages {
  const normalized = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
  return messages[normalized];
}

export default messages;
