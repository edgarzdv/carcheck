import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
  serverExternalPackages: ['rtl-pdf'],
  outputFileTracingIncludes: {
    '/api/report': ['./assets/fonts/NotoSansHebrew-Medium.ttf', './node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/*'],
  },
};

export default nextConfig;
