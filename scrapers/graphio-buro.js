import { runWordpressFeed } from './lib/scrapeWordpress.js';

const SHOP_NAME = 'Graphio/büro-stil';
const SITE_URL = 'https://graphio-buro.com';

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/selections/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/selections?_embed&per_page=100`,
    feedPath: 'graphio-buro.xml',
    buildContent: (post) => post?.content?.rendered || undefined,
});
