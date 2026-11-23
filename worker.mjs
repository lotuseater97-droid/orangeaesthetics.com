import { onRequestPost } from './functions/api/appointment-request.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    if (path === '/api/appointment-request') {
      if (request.method !== 'POST') return new Response(null, {status:405, headers:{allow:'POST'}});
      return onRequestPost({request, env});
    }
    if (path.startsWith('/api/') || path.startsWith('/app/') || path.startsWith('/functions/') || path.startsWith('/scripts/') || path.startsWith('/.github/') || /\.(mjs|sql|toml|md)$/.test(path)) {
      return new Response('Not found', {status:404});
    }
    return env.ASSETS.fetch(request);
  }
};
