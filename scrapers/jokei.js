import { scrapeShop } from './lib/scrapeBase.js';

await scrapeShop({
    shopUrl: 'https://jokei.theshop.jp',
    outputFile: 'jokei.xml',
    feedTitle: '叙景 jokei',
    feedDesc: 'jokei.theshop.jp の新着商品フィード',
});
