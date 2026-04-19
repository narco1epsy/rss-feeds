import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = 'iens';
const SITE_URL = 'https://iens.base.shop';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'iens.xml',
});
