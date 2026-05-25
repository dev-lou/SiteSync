import { httpRouter } from 'convex/server';
import { createAuth } from './auth';

const http = httpRouter();

const auth = createAuth();

auth.registerRoutes(http);

http.route({
  path: '/health',
  method: 'GET',
  handler: async () => {
    return new Response('OK', { status: 200 });
  },
});

export default http;
