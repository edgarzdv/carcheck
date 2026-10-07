import type { Config, Context } from '@netlify/edge-functions';

export default (_request: Request, context: Context) => context.next();

export const config: Config = {
  path: '/api/report',
  rateLimit: { windowLimit: 2, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
