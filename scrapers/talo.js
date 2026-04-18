import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const SHOP_NAME = '北欧家具talo';
const SHOP_URL = 'https://www.talo.tv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../docs');
mkdirSync(docsDir, { recursive: true });

async function scrape() {
    const res = await fetch(SHOP_URL);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const feed = new Feed({
        title: SHOP_NAME,
        link: SHOP_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
    });

    // New Arrival section のみ対象 (.top-section の最初の ul.m-item-list)
    const $newArrival = $('section.top-section').first().find('ul.m-item-list');

    $newArrival.find('li').each((_, el) => {
        const $a = $(el).find('a.m-item-unit');
        const href = $a.attr('href') || '';
        const link = href.startsWith('http') ? href : `${SHOP_URL}${href}`;
        const image = $a.find('img.m-item-unit__img').attr('src') || '';
        const itemNum = $a.find('.m-item-unit__num').text().trim();
        const rawName = $a.find('.m-item-unit__name').text().replace(/\s+/g, ' ').trim();
        const price = $a.find('.m-item-unit__price').text().trim();
        const tax = $a.find('.m-item-unit__tax').text().trim();

        if (!link || !rawName) return;

        feed.addItem({
            title: rawName,
            link,
            date: new Date(),
            id: link,
            description: `${itemNum} ${price}${tax}`.trim(),
            image,
        });
    });

    const outPath = path.join(docsDir, 'talo.xml');
    writeFileSync(outPath, feed.rss2());
    console.log(`written: ${outPath} (${feed.items.length} items)`);
}

scrape().catch((e) => {
    console.error(e);
    process.exit(1);
});
