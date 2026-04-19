import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = 'Kos Vintage';
const SITE_URL = 'https://kosvintage.official.ec';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'kosvintage.xml',
});
