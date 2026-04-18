import { scrapeBaseShop } from './lib/scrapeBaseShop.js';

await scrapeBaseShop({
    metaUrl: import.meta.url,
    shopUrl: 'https://ampm.buyshop.jp',
    outputFile: 'ampm.xml',
    feedTitle: 'vintage shop AM/PM',
    feedDesc: 'vintage shop AM/PM の新着商品フィード',
    selectors: {
        itemBox: '.item',
        anchor: 'a[href*="/items/"]',
        title: '.itemTitle h2',
        price: '.itemPrice div',
        img: '.itemThumbImg img',
    },
});
