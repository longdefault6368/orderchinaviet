import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api-client';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/*/admin/',
          '/*/dashboard/',
          '/*/orders/',
          '/*/packages/',
          '/*/transactions/',
          '/*/withdrawals/',
          '/*/settings/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
