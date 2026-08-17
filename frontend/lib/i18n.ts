import en from '../messages/en.json';
import vi from '../messages/vi.json';
import zh from '../messages/zh.json';

export type Locale = 'en' | 'vi' | 'zh';

const dictionaries = { en, vi, zh };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.vi;
}

export function translate(dict: any, keyPath: string, fallback?: string): string {
  const keys = keyPath.split('.');
  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || keyPath;
    }
  }
  return typeof current === 'string' ? current : fallback || keyPath;
}
