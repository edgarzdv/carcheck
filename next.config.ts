import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['rtl-pdf'],
  outputFileTracingIncludes: {
    '/api/report': ['./assets/fonts/NotoSansHebrew-Medium.ttf', './node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/*'],
  },
};

export default nextConfig;
