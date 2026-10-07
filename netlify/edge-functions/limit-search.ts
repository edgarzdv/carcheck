import type { Config, Context } from '@netlify/edge-functions';

export default (_request: Request, context: Context) => context.next();

// Applied by Netlify before the Next.js page calls data.gov.il.
export const config: Config = {
  path: '/',
  rateLimit: { windowLimit: 6, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
