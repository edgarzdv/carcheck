import type { Metadata } from 'next';

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | AUTOPEEK`, description, url: path, siteName: 'AUTOPEEK', locale: 'he_IL', type: 'website' },
    twitter: { card: 'summary', title: `${title} | AUTOPEEK`, description },
  };
}
