import { scrapeBaseShop } from './lib/scrapeBaseShop.js';

await scrapeBaseShop({
    metaUrl: import.meta.url,
    shopUrl: 'https://ampm.buyshop.jp',
    feedFile: 'ampm.xml',
    shopName: 'vintage shop AM/PM',
    selectors: {
        itemBox: '.item',
        anchor: 'a[href*="/items/"]',
        title: '.itemTitle h2',
        price: '.itemPrice div',
        img: '.itemThumbImg img',
    },
});
