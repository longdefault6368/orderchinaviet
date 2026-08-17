import { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['vi', 'zh', 'en'];

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
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : route.includes('rates') || route.includes('services') ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route.includes('rates') || route.includes('careers') || route.includes('services') ? 0.9 : 0.7,
      });
    }
  }

  return sitemapEntries;
}
