import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = 'NO AGE';
const SITE_URL = 'https://noage.theshop.jp';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'noage.xml',
});
