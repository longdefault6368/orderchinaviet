import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api-client';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const locales = ['vi', 'zh'];

  const staticRoutes = [
    '',
    '/rates',
    '/careers',
    '/track',
    '/services/1688',
    '/services/taobao',
    '/services/tmall',
    '/services/van-chuyen',
    '/affiliate/portal',
    '/blog',
    '/guides',
    '/policies',
    '/register',
    '/login',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : route.includes('rates') || route.includes('services') ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route.includes('rates') || route.includes('careers') || route.includes('services') ? 0.9 : 0.7,
      });
    }
  }

  return sitemapEntries;
}
