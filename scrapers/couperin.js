import { runWordpressFeed } from './lib/scrapeWordpress.js';
import { stripHtml } from './lib/normalize.js';

const SHOP_NAME = 'Couperin';
const SITE_URL = 'https://couperin.net';
const CATEGORY_ID = 46;

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=100&categories=${CATEGORY_ID}`,
    feedPath: 'couperin.xml',
    buildDescription: (post) => stripHtml(post?.excerpt?.rendered || ''),
    buildContent: (post) => post?.content?.rendered || undefined,
});
