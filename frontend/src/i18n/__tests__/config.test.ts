import { locales, defaultLocale, LOCALE_COOKIE } from '../config';

describe('i18n config', () => {
  it('has correct values', () => {
    expect(locales).toEqual(['en', 'zh']);
    expect(defaultLocale).toBe('en');
    expect(LOCALE_COOKIE).toBe('NEXT_LOCALE');
  });
});
