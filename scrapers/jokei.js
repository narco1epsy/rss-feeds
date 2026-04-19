import { scrapeBaseShop } from './lib/scrapeBaseShop.js';

await scrapeBaseShop({
    metaUrl: import.meta.url,
    shopUrl: 'https://jokei.theshop.jp',
    feedFile: 'jokei.xml',
    shopName: '叙景 jokei',
    selectors: {
        itemBox: '.item-box',
        anchor: 'a',
        title: '.item-title',
        price: '.item-price',
        img: 'img',
    },
});
