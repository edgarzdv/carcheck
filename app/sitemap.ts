import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/compare', '/garages', '/appraisers', '/guide', '/guide/mileage', '/guide/recalls', '/contact', '/terms', '/privacy', '/accessibility'].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
