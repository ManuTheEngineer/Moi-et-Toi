// Cloudflare Worker — proxies Claude API calls so the key stays server-side.
// Deploy: `npx wrangler deploy api/proxy-worker.js --name met-ai-proxy`
// Set secret: `npx wrangler secret put CLAUDE_API_KEY`
// Then point your app at  https://met-ai-proxy.<your-subdomain>.workers.dev/v1/messages

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();

    // Only allow known models
    const allowed = ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
    if (!allowed.includes(body.model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cap tokens
    if (body.max_tokens > 2048) body.max_tokens = 2048;

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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
