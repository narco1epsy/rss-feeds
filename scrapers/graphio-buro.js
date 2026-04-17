import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const SHOP_NAME = 'Graphio/büro-stil Selections';
const BASE_URL = 'https://graphio-buro.com/selections/';

async function run() {
    const res = await fetch(BASE_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];

    $('a[href*="/selections/"]').each((_, a) => {
        const url = $(a).attr('href');
        // カテゴリ・タグ・ページネーションを除外し、商品詳細URLのみ取得
        if (!url.match(/\/selections\/[^/]+\/[^/]+\/$/)) return;

        const figure = $(a).find('figure');
        if (!figure.length) return;

        const name = figure.find('h2.selections-name').text().trim();
        const img = figure.find('img').attr('src') || '';
        const status = figure.find('.selections-status').text().trim();

        if (name) {
            items.push({ name, url, img, status });
        }
    });

    const feed = new Feed({
        title: SHOP_NAME,
        link: BASE_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
    });

    for (const item of items) {
        feed.addItem({
            title: item.name,
            link: item.url,
            date: new Date(),
            id: item.url,
            description: `ステータス: ${item.status}`,
            image: item.img,
        });
    }

    const docsDir = path.resolve(fileURLToPath(import.meta.url), '../../docs');
    fs.writeFileSync(path.join(docsDir, 'graphio-buro.xml'), feed.rss2());
    console.log(`Done: ${items.length} items`);
}

run();
