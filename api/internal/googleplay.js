const gplay = await import('google-play-scraper');

async function getGooglePlayResults(term, country, limit) {
  const results = await gplay.default.search({ term, num: limit, country });
  return results.map(app => ({
    appId: app.appId,
    title: app.title,
    icon: app.icon,
    developer: app.developer,
    source: 'googleplay',
  }));
}

module.exports = { getGooglePlayResults };
