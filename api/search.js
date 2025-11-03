/**
 * Vercel serverless API route
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */

const VALID_API_KEY = process.env.FIGMA_PLUGIN_API_KEY;
const { getGooglePlayResults } = require('./_internal/googleplay');
const { getAppStoreResults } = require('./_internal/appstore');

module.exports = async (req, res) => {
  // CORS + key check ở đây thôi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.end();

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== VALID_API_KEY) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid API Key' }));
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const term = url.searchParams.get('term');
    const country = url.searchParams.get('country') || 'us';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const store = url.searchParams.get('store') || 'google';

    if (!term) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Missing search term' }));
    }

    if (store === 'google') {
      const data = await getGooglePlayResults(term, country, limit);
      return res.end(JSON.stringify({ data }));
    }

    if (store === 'appstore') {
      const data = await getAppStoreResults(term, country, limit);
      return res.end(JSON.stringify({ data }));
    }

    if (store === 'all') {
      const [gp, as] = await Promise.all([
        getGooglePlayResults(term, country, limit),
        getAppStoreResults(term, country, limit),
      ]);
      return res.end(JSON.stringify({ google: gp, appstore: as }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};


