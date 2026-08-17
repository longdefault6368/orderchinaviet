import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const LOCALES = ['en', 'vi', 'zh'];
const DEFAULT_LOCALE = 'vi';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('favicon.ico') || pathname.includes('logo.png') || PUBLIC_FILE.test(pathname)) return NextResponse.next();
  const pathnameHasLocale = LOCALES.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  if (pathnameHasLocale) return NextResponse.next();
  let locale = request.cookies.get('NEXT_LOCALE')?.value;
  if (!locale || !LOCALES.includes(locale)) {
    const acceptLang = request.headers.get('accept-language') || '';
    locale = acceptLang.includes('zh') ? 'zh' : acceptLang.includes('en') ? 'en' : DEFAULT_LOCALE;
  }
  request.nextUrl.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'] };
