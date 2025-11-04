/**
 * Vercel serverless API route
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */

const VALID_API_KEY = process.env.FIGMA_PLUGIN_API_KEY;

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSameApp(g, a) {
  const gTitle = normalize(g.title);
  const aTitle = normalize(a.title);
  const gDev = normalize(g.developer);
  const aDev = normalize(a.developer || a.sellerName || "");

  const titleClose =
    gTitle === aTitle || gTitle.includes(aTitle) || aTitle.includes(gTitle);
  const devClose =
    gDev && aDev ? (gDev === aDev || gDev.includes(aDev) || aDev.includes(gDev)) : false;

  return titleClose && devClose;
}

function mergeResults(googleArr = [], appstoreArr = []) {
  const merged = [];

  for (const g of googleArr) {
    merged.push({
      appId: g.appId,
      title: g.title,
      developer: g.developer,
      icon: g.icon,
      stores: {
        googlePlay: g.stores?.googlePlay || { appId: g.appId },
      },
    });
  }

  for (const a of appstoreArr) {
    const found = merged.find((m) => isSameApp(m, a));
    if (found) {
      found.stores.appStore =
        a.stores?.appStore || { appId: a.appId || a.id || a.bundleId };
      if (!found.icon && a.icon) {
        found.icon = a.icon;
      }
    } else {
      merged.push({
        appId: a.appId || a.id,
        title: a.title,
        developer: a.developer || a.sellerName || "",
        icon: a.icon,
        stores: {
          appStore: a.stores?.appStore || { appId: a.appId || a.id },
        },
      });
    }
  }

  return merged;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    return res.end();
  }

  const apiKey = Array.isArray(req.headers["x-api-key"])
    ? req.headers["x-api-key"][0]
    : req.headers["x-api-key"];

  if (apiKey !== VALID_API_KEY) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Invalid API Key" }));
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const term = url.searchParams.get("term");
    const country = url.searchParams.get("country") || "us";
    const limit = 200;
    const store = url.searchParams.get("store") || "google";

    if (!term) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Missing search term" }));
    }

    if (store === "google") {
      const gplayMod = await import("google-play-scraper");
      const gplay = gplayMod.default;

      const gRes = await gplay.search({ term, num: limit, country });

      const data = gRes.map((app) => ({
        appId: app.appId,
        title: app.title,
        icon: app.icon,
        developer: app.developer,
        stores: {
          googlePlay: { appId: app.appId },
        },
      }));

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ data }));
    }

    if (store === "appstore") {
      const { default: appstore } = await import("app-store-scraper");

      const aRes = await appstore.search({ term, num: limit, country });

      const data = aRes.map((app) => ({
        appId: app.id,
        title: app.title,
        icon: app.icon,
        developer: app.developer || app.sellerName || "",
        stores: {
          appStore: { appId: app.id },
        },
      }));

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ data }));
    }

    const [{ default: gplay }, { default: appstore }] = await Promise.all([
      import("google-play-scraper"),
      import("app-store-scraper"),
    ]);

    const [gRes, aRes] = await Promise.all([
      gplay.search({ term, num: limit, country }),
      appstore.search({ term, num: limit, country }),
    ]);

    const googleNorm = gRes.map((app) => ({
      appId: app.appId,
      title: app.title,
      icon: app.icon,
      developer: app.developer,
      stores: { googlePlay: { appId: app.appId } },
    }));

    const appstoreNorm = aRes.map((app) => ({
      appId: app.id,
      title: app.title,
      icon: app.icon,
      developer: app.developer || app.sellerName || "",
      stores: { appStore: { appId: app.id } },
    }));

    const merged = mergeResults(googleNorm, appstoreNorm);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({
      data: merged
    }));
  } catch (err) {
    console.error("API ERROR:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: err.message }));
  }
};
