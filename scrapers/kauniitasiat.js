import { runBaseShopFeed } from './lib/scrapeBaseShop.js';

const SHOP_NAME = 'kauniit asiat';
const SITE_URL = 'https://kauniitasiat.official.ec';

await runBaseShopFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: SITE_URL,
    apiUrl: `${SITE_URL}/load_items/1?response_type=json`,
    feedFile: 'kauniitasiat.xml',
});
