import { redirect } from 'next/navigation';

export default async function LegacyWaybillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/packages`);
}
