import { scrapeShop } from './lib/scrapeBase.js';

await scrapeShop({
    shopUrl: 'https://jokei.theshop.jp',
    outputFile: 'jokei.xml',
    feedTitle: '叙景 jokei',
    feedDesc: '叙景 jokei の新着商品フィード',
    selectors: {
        itemBox: '.item-box',
        anchor: 'a',
        title: '.item-title',
        price: '.item-price',
        img: 'img',
    },
});
