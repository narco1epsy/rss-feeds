import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOPNAME = 'decoboco';
const SITEURL = 'https://shop.decobocostore.com';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOPNAME,
    siteUrl: SITEURL,
    apiUrl: `${SITEURL}/load_items/1?response_type=json`,
    feedFile: 'decoboco.xml',
});
