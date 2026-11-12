/**
 * Cloudflare Worker: Portfolio Visitor Counter
 *
 * Deploy to Cloudflare Workers (free tier: 100k requests/day)
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Application
 * 2. Choose "Workers" → "Hello World" template → Deploy
 * 3. In Worker settings, add a KV namespace binding named "VISITOR_KV"
 * 4. Replace YOUR_SUBDOMAIN in script.js with your actual worker URL
 * 5. Optional: Add custom domain or use the *.workers.dev URL
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const kv = env.VISITOR_KV;
      const COUNTER_KEY = 'portfolio:total_visits';

      // Get current count
      let count = parseInt(await kv.get(COUNTER_KEY)) || 0;

      // Increment atomically
      count += 1;
      await kv.put(COUNTER_KEY, count.toString());

      // Extract visitor location from Cloudflare headers
      // cf-ipcountry: ISO 3166-1 alpha-2 country code
      // cf-ipcity: City name (if available)
      // cf-ipcontinent: Continent code
      // cf-iplatitude, cf-iplongitude: Coordinates
      // cf-timezone: Timezone
      const country = request.headers.get('cf-ipcountry') || 'Unknown';
      const city = request.headers.get('cf-ipcity') || '';
      const continent = request.headers.get('cf-ipcontinent') || '';
      const timezone = request.headers.get('cf-timezone') || '';
      const colo = request.headers.get('cf-ray')?.split('-').pop() || ''; // Cloudflare PoP code

      const location = {
        country: country === 'XX' ? 'Unknown' : country,
        city: city || null,
        continent: continent || null,
        timezone: timezone || null,
        colo: colo || null,
      };

      return new Response(JSON.stringify({ count, location }), {
        headers: corsHeaders,
      });
    } catch (err) {
      console.error('Visitor counter error:', err);
      return new Response(JSON.stringify({
        count: 0,
        location: { country: 'Error', city: null },
        error: 'Internal server error'
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};