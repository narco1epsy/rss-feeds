import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = '叙景 jokei';
const SITE_URL = 'https://jokei.theshop.jp';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'jokei.xml',
});
