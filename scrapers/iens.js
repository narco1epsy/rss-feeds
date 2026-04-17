import { scrapeShop } from './lib/scrapeBase.js';

await scrapeShop({
    shopUrl: 'https://iens.base.shop',
    outputFile: 'iens.xml',
    feedTitle: 'iens',
    feedDesc: 'iens の新着商品フィード',
    selectors: {
        itemBox: 'a.c-card.js-item.js-itemLink',
        anchor: 'a.c-card.js-item.js-itemLink',
        title: '.c-card-title',
        price: '.off-price',
        img: '.c-card-visual-img',
    },
});
