import '@testing-library/jest-dom';
import * as fs from 'fs';
import * as path from 'path';

// Load en.json directly
const enMessagesPath = path.resolve(__dirname, './messages/en.json');
const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf-8'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNestedValue = (obj: Record<string, unknown>, pathStr: string): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pathStr.split('.').reduce((acc: any, part) => acc && acc[part], obj);
};

const createMockT = (namespace?: string) => {
  const t = (key: string, values?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let translation = getNestedValue(enMessages, fullKey) || fullKey;
    if (values && typeof translation === 'string') {
      Object.keys(values).forEach(k => {
        translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k]));
      });
    }
    return translation;
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.rich = (key: string, values?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let translation = getNestedValue(enMessages, fullKey) || fullKey;
    if (values && typeof translation === 'string') {
      Object.keys(values).forEach(k => {
        if (typeof values[k] === 'function') {
          // just mock the rich text by calling the function with a placeholder or removing it
          translation = translation.replace(new RegExp(`<${k}>(.*?)<\\/${k}>`, 'g'), values[k]('$1'));
        } else {
          translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), values[k]);
        }
      });
    }
    return translation;
  };

  return t;
};

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => createMockT(namespace),
  useLocale: () => 'en',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NextIntlClientProvider: ({ children }: any) => children
}));

jest.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) => createMockT(namespace),
  getLocale: async () => 'en',
  getMessages: async () => enMessages
}));

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn()
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  }
}));

jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter', style: { fontFamily: 'inter' }, variable: '--font-inter' }),
  Orbitron: () => ({ className: 'orbitron', style: { fontFamily: 'orbitron' }, variable: '--font-orbitron' }),
  Noto_Sans_SC: () => ({ className: 'noto-sans-sc', style: { fontFamily: 'noto-sans-sc' }, variable: '--font-noto-sans-sc' })
}));
