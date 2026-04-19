import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = "SHABBY'S MARKETPLACE";
const SITE_URL = 'https://www.shabbys-officialstore.com';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'shabbys.xml',
});
