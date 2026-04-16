import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const SHOP_URL = 'https://jokei.theshop.jp';

// scrapers/jokei.js → ../docs/ を絶対パスで解決
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.resolve(__dirname, '../docs/jokei.xml');

async function scrape() {
    const res = await fetch(SHOP_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
    });
    const data = await res.text();

    const $ = cheerio.load(data);
    const items = [];

    $('.item-box').each((_, el) => {
        if ($(el).find('.soldout').length > 0) return;

        const a = $(el).find('a').first();
        const url = a.attr('href');
        const title = $(el).find('.item-title').text().trim();
        const price = $(el).find('.item-price').text().trim();
        const img = $(el).find('img').attr('src');

        if (url && title) {
            items.push({ url, title, price, img });
        }
    });

    const feed = new Feed({
        title: '叙景 jokei - 新着商品',
        description: 'jokei.theshop.jp の新着商品フィード',
        // id: SHOP_URL,
        link: SHOP_URL,
        language: 'ja',
        updated: new Date(),
    });

    items.forEach((item) => {
        feed.addItem({
            title: item.title,
            // id: item.url,
            link: item.url,
            description: item.img ? `<img src="${item.img}" /><br>${item.price}` : item.price,
            date: new Date(),
        });
    });

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, feed.rss2());
    console.log(`✅ ${items.length}件取得 → ${OUTPUT_FILE}`);
}

scrape().catch(console.error);
