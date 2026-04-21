import { runWixStoreFeed } from './lib/scrapeWixStore.js';

await runWixStoreFeed({
    metaUrl: import.meta.url,
    shopName: 'STILL LIFE',
    shopUrl: 'https://www.still-life-nagoya.net/shop',
    siteUrl: 'https://www.still-life-nagoya.net',
    feedFile: 'still-life-nagoya.xml',
});
