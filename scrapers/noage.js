import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOPNAME = 'NO AGE';
const SITEURL = 'https://noage.theshop.jp';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOPNAME,
    siteUrl: SITEURL,
    apiUrl: `${SITEURL}/load_items/1?response_type=json`,
    feedFile: 'noage.xml',
});
