/*
Sample sitemap index and child sitemap outputs for a small dataset:

Sitemap index (sitemap.xml):
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemaps/directory/categories.xml</loc>
    <lastmod>2026-02-06T00:00:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemaps/directory/cities-1.xml</loc>
    <lastmod>2026-02-06T00:00:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemaps/directory/companies-1.xml</loc>
    <lastmod>2026-02-06T00:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>

Child sitemap (categories.xml):
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/directory</loc>
    <lastmod>2026-02-06T00:00:00.000Z</lastmod>
  </url>
  <url>
    <loc>https://example.com/prices/pressure-washing</loc>
    <lastmod>2026-02-05T00:00:00.000Z</lastmod>
  </url>
</urlset>
*/

const { XMLParser } = require("fast-xml-parser");

const SITEMAP_URL_LIMIT = 25000;

function chunkCount(total, size) {
  return Math.max(1, Math.ceil(total / size));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateXml(xml, rootKey) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  assert(parsed[rootKey], `Missing root element: ${rootKey}`);
}

function run() {
  // Chunking test
  assert(chunkCount(0, SITEMAP_URL_LIMIT) === 1, "Chunking: 0 should produce 1 page");
  assert(chunkCount(1, SITEMAP_URL_LIMIT) === 1, "Chunking: 1 should produce 1 page");
  assert(chunkCount(SITEMAP_URL_LIMIT, SITEMAP_URL_LIMIT) === 1, "Chunking: limit should produce 1 page");
  assert(chunkCount(SITEMAP_URL_LIMIT + 1, SITEMAP_URL_LIMIT) === 2, "Chunking: limit+1 should produce 2 pages");

  // XML well-formedness tests
  const sampleIndex = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap>\n    <loc>https://example.com/sitemaps/directory/categories.xml</loc>\n    <lastmod>2026-02-06T00:00:00.000Z</lastmod>\n  </sitemap>\n` +
    `</sitemapindex>`;

  const sampleChild = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n    <loc>https://example.com/directory</loc>\n    <lastmod>2026-02-06T00:00:00.000Z</lastmod>\n  </url>\n` +
    `</urlset>`;

  validateXml(sampleIndex, "sitemapindex");
  validateXml(sampleChild, "urlset");

  console.log("Sitemap validation OK");
}

run();
