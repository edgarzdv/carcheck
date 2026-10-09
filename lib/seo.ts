import type { Metadata } from 'next';

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | RehevNet`, description, url: path, siteName: 'RehevNet', locale: 'he_IL', type: 'website' },
    twitter: { card: 'summary', title: `${title} | RehevNet`, description },
  };
}
