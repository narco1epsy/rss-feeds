import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOPNAME = '偏集舎';
const SITEURL = 'https://henshusha.theshop.jp';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOPNAME,
    siteUrl: SITEURL,
    apiUrl: `${SITEURL}/load_items/1?response_type=json`,
    feedFile: 'henshusha.xml',
});
