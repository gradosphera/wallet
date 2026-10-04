export const config = { runtime: 'edge' };

function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-App-ClientID, X-App-Version, X-App-Env, X-Client-Info, Accept',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
    'Vary': 'Origin',
  };
}

const TARGET = 'https://toncenter.mytonwallet.org';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }

  const targetUrl = new URL(TARGET);
  const path = url.pathname.replace(/^\/api\/toncenter/, '');
  targetUrl.pathname = path || '/';
  targetUrl.search = url.search;

  const headers = new Headers(req.headers);
  headers.set('Host', targetUrl.hostname);

  try {
    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'follow',
    });
    const outHeaders = new Headers(res.headers);
    const cors = getCorsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) outHeaders.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: outHeaders });
  } catch (e) {
    return new Response('Proxy error', { status: 502, headers: getCorsHeaders(origin) });
  }
}
