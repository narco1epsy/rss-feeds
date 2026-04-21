import { runWixStoreFeed } from './lib/scrapeWixStore.js';

await runWixStoreFeed({
    metaUrl: import.meta.url,
    shopName: 'higurashi',
    shopUrl: 'https://www.hgrs.jp/online-shop',
    siteUrl: 'https://www.hgrs.jp',
    feedFile: 'hgrs.xml',
});
