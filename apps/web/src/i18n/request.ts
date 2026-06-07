import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { cookies } from 'next/headers';
import { getMessages, DEFAULT_LOCALE, LOCALES } from '@kitalent/i18n';

export const LOCALE_COOKIE = 'KITALENT_LOCALE';

/**
 * Cookie-based locale (no URL prefix) so users can switch language from the
 * login page, profile, and settings without changing routes (PRD §13 #2).
 * Messages come from the shared @kitalent/i18n catalog — the single source of
 * truth across web and mobile.
 */
export default getRequestConfig(async () => {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = (LOCALES as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as string)
    : DEFAULT_LOCALE;

  return { locale, messages: getMessages(locale) as AbstractIntlMessages };
});
