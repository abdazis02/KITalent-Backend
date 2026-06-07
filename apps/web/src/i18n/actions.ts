'use server';

import { cookies } from 'next/headers';
import { LOCALES } from '@kitalent/i18n';
import { LOCALE_COOKIE } from './request';

/** Persists the chosen locale to a cookie. The page re-renders with new messages. */
export async function setLocale(locale: string): Promise<void> {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  cookies().set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
