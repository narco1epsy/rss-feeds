import { scrapeBaseShop } from './lib/scrapeBaseShop.js';

await scrapeBaseShop({
    metaUrl: import.meta.url,
    shopUrl: 'https://mobelman.official.ec',
    feedFile: 'mobelman.xml',
    shopName: '中古家具のmaru（株式会社モーベルマン）',
    selectors: {
        itemBox: 'a.c-card.js-item.js-itemLink',
        anchor: 'a.c-card.js-item.js-itemLink',
        title: '.c-card__title',
        price: '.c-card__price',
        img: '.c-card__img',
    },
});
