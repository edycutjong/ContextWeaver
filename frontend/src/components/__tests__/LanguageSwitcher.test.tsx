
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher, { setLocaleCookie } from '../LanguageSwitcher';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { type Locale } from '@/i18n/config';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
  useLocale: jest.fn(),
}));

describe('LanguageSwitcher Component', () => {
  const mockRefresh = jest.fn();
  const mockT = jest.fn((key) => {
    if (key === 'languageEn') return 'English';
    if (key === 'languageZh') return '中文';
    return key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
    (useTranslations as jest.Mock).mockReturnValue(mockT);
    (useLocale as jest.Mock).mockReturnValue('en');

    document.cookie = 'NEXT_LOCALE=; Max-Age=0; path=/';
    localStorage.clear();
  });

  it('renders both language buttons always visible', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('active locale button has aria-pressed true, inactive has false', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('中文').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches to Chinese and refreshes router when 中文 is clicked', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByText('中文'));

    expect(screen.getByText('中文').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('EN').closest('button')).toHaveAttribute('aria-pressed', 'false');
    expect(mockRefresh).toHaveBeenCalled();
    expect(document.cookie).toContain('NEXT_LOCALE=zh');

    const settings = JSON.parse(localStorage.getItem('contextweaver_settings') || '{}');
    expect(settings.language).toBe('zh');
  });

  it('switches back to English and refreshes router when EN is clicked', () => {
    (useLocale as jest.Mock).mockReturnValue('zh');
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByText('EN'));

    expect(screen.getByText('EN').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(mockRefresh).toHaveBeenCalled();
    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });

  it('setLocaleCookie handles localStorage errors gracefully', () => {
    const spySetItem = jest.spyOn(Storage.prototype, 'setItem');

    spySetItem.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    }).mockImplementation(() => {
      // Success for subsequent calls
    });

    expect(() => setLocaleCookie('zh' as Locale)).not.toThrow();

    spySetItem.mockRestore();
  });

  it('setLocaleCookie handles existing localStorage data', () => {
    localStorage.setItem('contextweaver_settings', JSON.stringify({ theme: 'dark' }));

    setLocaleCookie('zh' as Locale);

    const settings = JSON.parse(localStorage.getItem('contextweaver_settings') || '{}');
    expect(settings.theme).toBe('dark');
    expect(settings.language).toBe('zh');
  });
});
