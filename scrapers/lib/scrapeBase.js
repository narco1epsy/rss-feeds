import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs');

/**
 * @param {object} config
 * @param {string} config.shopUrl
 * @param {string} config.outputFile   - docs/ 以下のファイル名 (例: 'jokei.xml')
 * @param {string} config.feedTitle
 * @param {string} config.feedDesc
 * @param {object} [config.selectors]  - CSSセレクターの上書き（省略可）
 */
export async function scrapeShop(config) {
    const sel = {
        itemBox: '.item-box',
        anchor: 'a',
        title: '.item-title',
        price: '.item-price',
        img: 'img',
        ...config.selectors,
    };

    const res = await fetch(config.shopUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
    });
    const $ = cheerio.load(await res.text());

    const items = [];
    $(sel.itemBox).each((_, el) => {
        const url = $(el).find(sel.anchor).first().attr('href');
        const title = $(el).find(sel.title).text().trim();
        const price = $(el).find(sel.price).text().trim();
        const img = $(el).find(sel.img).attr('src');
        if (url && title) items.push({ url, title, price, img });
    });

    const feed = new Feed({
        title: config.feedTitle,
        link: config.shopUrl,
        description: config.feedDesc,
        language: 'ja',
    });

    items.forEach((item) => {
        feed.addItem({
            title: item.title,
            link: item.url,
            date: new Date(),
            id: item.url,
            description: item.price,
            image: item.img || undefined,
        });
    });

    const outPath = path.join(ROOT, config.outputFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, feed.rss2());
    console.log(`✅ ${items.length}件 → ${outPath}`);
}
