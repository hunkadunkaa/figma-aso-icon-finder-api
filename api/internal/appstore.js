const appstore = await import('app-store-scraper');

async function getAppStoreResults(term, country, limit) {
  const results = await appstore.search({ term, num: limit, country });
  return results.map(app => ({
    appId: app.id,
    title: app.title,
    icon: app.icon,
    developer: app.developer || app.sellerName || '',
    source: 'appstore',
  }));
}

module.exports = { getAppStoreResults };
