/**
 * Vercel serverless API route
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */

const VALID_API_KEY = process.env.FIGMA_PLUGIN_API_KEY;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  const apiKey = Array.isArray(req.headers['x-api-key'])
    ? req.headers['x-api-key'][0]
    : req.headers['x-api-key'];


  if (apiKey !== VALID_API_KEY) {
    res.statusCode = 401;
    res.writeHead('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Invalid API Key' }));
  }

  try {
    const gplay = await import("google-play-scraper");
    const url = new URL(req.url, `http://${req.headers.host}`);

    const term = url.searchParams.get('term');

    if (!term) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Missing search term' }));
    }
    
    const country = url.searchParams.get('country') ?? 'us';
    const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);

    const results = await gplay.default.search({ term, num: limit, country });

    const mapped = results.map(app => ({
      appId: app.appId,
      title: app.title,
      icon: app.icon,
      developer: app.developer,
    }));

    res.writeHead(200, {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
});
    res.end(JSON.stringify({ data: mapped }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}

