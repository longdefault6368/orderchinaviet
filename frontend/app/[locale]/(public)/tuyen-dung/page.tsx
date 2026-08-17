import { redirect, RedirectType } from 'next/navigation';
import { Locale } from '@/lib/i18n';

export default async function TuyenDungRedirectPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect(`/${locale}/careers`, RedirectType.replace);
}
