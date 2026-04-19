import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = 'vintage shop AM/PM';
const SITE_URL = 'https://ampm.buyshop.jp';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'ampm.xml',
});
