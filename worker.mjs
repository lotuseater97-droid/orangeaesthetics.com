import { onRequestPost } from './functions/api/appointment-request.js';

// Only serve explicitly public file formats; never expose application source or config.
const publicTypes = new Set(['html','css','js','png','jpg','jpeg','webp','gif','svg','ico','woff','woff2','ttf','otf','avif','webmanifest','xml','txt']);
const hiddenDirs = new Set(['app','functions','scripts','node_modules','tests','private','internal','src']);
const reply = (status, message) => new Response(message,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path;
    try { path = decodeURIComponent(url.pathname).replaceAll('\\','/').toLowerCase(); }
    catch { return reply(400,'Invalid path'); }
    if (path === '/api/appointment-request') {
      if (request.method !== 'POST') return new Response(null,{status:405,headers:{allow:'POST'}});
      return onRequestPost({request,env});
    }
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{allow:'GET, HEAD'}});
    const segments = path.split('/').filter(Boolean);
    if (path.includes('..') || path.includes('//') || segments.some(s=>s.startsWith('.') || hiddenDirs.has(s)) || path.startsWith('/api/')) return reply(404,'Not found');
    const last = segments.at(-1) || '';
    const extension = last.includes('.') ? last.split('.').at(-1) : '';
    if (extension && !publicTypes.has(extension)) return reply(404,'Not found');
    return env.ASSETS.fetch(request);
  }
};
