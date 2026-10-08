import type { Config, Context } from '@netlify/edge-functions';

export default (_request: Request, context: Context) => context.next();

export const config: Config = {
  path: '/api/contact',
  rateLimit: { windowLimit: 3, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
