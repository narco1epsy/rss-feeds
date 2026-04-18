import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const SHOP_NAME = 'Graphio/büro-stil';
const SITE_URL = 'https://graphio-buro.com/selections/';
const API_URL = 'https://graphio-buro.com/wp-json/wp/v2/selections?_embed&per_page=100';

function stripHtml(html) {
    const $ = cheerio.load(html || '');
    return $.text().replace(/\s+/g, ' ').trim();
}

async function main() {
    const res = await fetch(API_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
        },
    });

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    const posts = await res.json();

    const feed = new Feed({
        title: SHOP_NAME,
        link: SITE_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
    });

    for (const post of posts) {
        const title = stripHtml(post?.title?.rendered || '');
        const link = post?.link || '';
        const date = new Date(post?.modified || post?.date || Date.now());
        const image = post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

        const parts = [];

        const excerpt = stripHtml(post?.excerpt?.rendered || post?.content?.rendered || '');
        if (excerpt) parts.push(excerpt);

        const categories =
            post?._embedded?.['wp:term']?.[0]?.map((t) => t.name).filter(Boolean) || [];
        const tags = post?._embedded?.['wp:term']?.[1]?.map((t) => t.name).filter(Boolean) || [];
        if (categories.length) parts.push(`カテゴリ: ${categories.join(', ')}`);
        if (tags.length) parts.push(`タグ: ${tags.join(', ')}`);

        feed.addItem({
            title,
            link,
            date,
            description: parts.join('\n\n'),
            image,
        });
    }

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outputDir = path.resolve(currentDir, '../docs');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'graphio-buro.xml'), feed.rss2(), 'utf8');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
