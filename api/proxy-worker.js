// Cloudflare Worker — proxies Claude API calls so the key stays server-side.
// Deploy: `npx wrangler deploy api/proxy-worker.js --name met-ai-proxy`
// Set secret: `npx wrangler secret put CLAUDE_API_KEY`
// Set var:    `npx wrangler secret put ALLOWED_ORIGIN` (e.g. https://your-app.com)
// Then point your app at  https://met-ai-proxy.<your-subdomain>.workers.dev/v1/messages

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Origin check (skip if ALLOWED_ORIGIN not set)
    if (allowedOrigin !== '*') {
      const origin = request.headers.get('Origin') || '';
      if (origin !== allowedOrigin) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Rate limiting via Cloudflare KV or simple in-memory (per-worker instance)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate:${clientIP}`;
    const now = Date.now();

    // Simple per-request rate tracking (resets per worker instance — for production use KV or Durable Objects)
    if (!globalThis._rateLimits) globalThis._rateLimits = {};
    const limits = globalThis._rateLimits;
    if (!limits[rateLimitKey]) limits[rateLimitKey] = [];
    // Clean entries older than 1 minute
    limits[rateLimitKey] = limits[rateLimitKey].filter(t => now - t < 60000);
    if (limits[rateLimitKey].length >= 10) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...corsHeaders },
      });
    }
    limits[rateLimitKey].push(now);

    // Clean up old IPs every 100 requests to prevent memory growth
    const allKeys = Object.keys(limits);
    if (allKeys.length > 1000) {
      allKeys.forEach(k => {
        if (limits[k].length === 0 || now - limits[k][limits[k].length - 1] > 300000) {
          delete limits[k];
        }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Only allow known models
    const allowed = ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
    if (!allowed.includes(body.model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Cap tokens to prevent abuse
    if (body.max_tokens > 2048) body.max_tokens = 2048;

    // Cap tools to prevent prompt injection via excessive tool definitions
    if (body.tools && body.tools.length > 12) {
      body.tools = body.tools.slice(0, 12);
    }

    // Strip any attempt to override system-level instructions with role injection
    if (body.messages && Array.isArray(body.messages)) {
      body.messages = body.messages.filter(m => m.role === 'user' || m.role === 'assistant');
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
