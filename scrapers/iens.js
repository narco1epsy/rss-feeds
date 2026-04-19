import { scrapeBaseShop } from './lib/scrapeBaseShop.js';

await scrapeBaseShop({
    metaUrl: import.meta.url,
    shopUrl: 'https://iens.base.shop',
    feedFile: 'iens.xml',
    shopName: 'iens',
    selectors: {
        itemBox: 'a.c-card.js-item.js-itemLink',
        anchor: 'a.c-card.js-item.js-itemLink',
        title: '.c-card-title',
        price: '.off-price',
        img: '.c-card-visual-img',
    },
});
