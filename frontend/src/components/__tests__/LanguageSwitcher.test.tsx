
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
    
    // Clear cookie and localStorage
    document.cookie = 'NEXT_LOCALE=; Max-Age=0; path=/';
    localStorage.clear();
  });

  it('renders correctly in closed state', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens and closes the menu on click', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    
    // Open
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    
    // Close
    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu on click outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <LanguageSwitcher />
      </div>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu on Escape key', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('switches language and refreshes router', () => {
    render(<LanguageSwitcher />);
    
    fireEvent.click(screen.getByRole('button'));
    const zhButton = screen.getByText('中文');
    
    fireEvent.click(zhButton);
    
    // Check if current locale display updated
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    
    // Check if router.refresh was called
    expect(mockRefresh).toHaveBeenCalled();
    
    // Check cookie
    expect(document.cookie).toContain('NEXT_LOCALE=zh');
    
    // Check localStorage
    const settings = JSON.parse(localStorage.getItem('contextweaver_settings') || '{}');
    expect(settings.language).toBe('zh');
  });

  it('setLocaleCookie handles localStorage errors gracefully', () => {
    const spySetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    // First call throws, second call succeeds (mocking the catch block)
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
