import type { Config, Context } from '@netlify/edge-functions';

export default (_request: Request, context: Context) => context.next();

// One shared budget across every public lookup and report route.
// Netlify Free supports two code-based rules per project; the other protects contact submissions.
export const config: Config = {
  path: ['/', '/compare', '/garages', '/appraisers', '/api/report', '/api/compare-report'],
  rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
