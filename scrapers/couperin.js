import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Feed } from 'feed';

const SHOP_NAME = 'Couperin';
const SITE_URL = 'https://couperin.net';
const CATEGORY_ID = 46;
const API_URL = `${SITE_URL}/wp-json/wp/v2/posts?_embed=1&per_page=100&categories=${CATEGORY_ID}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outDir = resolve(__dirname, '../docs');
const outFile = resolve(outDir, 'couperin.xml');

const decodeHtml = (text = '') =>
    text
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();

const stripHtml = (html = '') =>
    decodeHtml(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+\n/g, '\n')
            .replace(/\n\s+/g, '\n')
            .replace(/\n{2,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
    );

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; rss-feed-bot/1.0; +https://github.com/)',
        },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${url}`);
    return res.json();
}

function pickImage(post) {
    return post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
}

function buildDescription(post) {
    const text = stripHtml(post?.content?.rendered || post?.excerpt?.rendered || '');
    return text;
}

function toItem(post) {
    return {
        title: decodeHtml(post?.title?.rendered || '').trim(),
        link: post?.link || '',
        date: new Date(post.date || post.modified || Date.now()),
        id: String(post.id || post?.link || ''),
        description: buildDescription(post),
        image: pickImage(post),
    };
}

async function main() {
    const posts = await fetchJson(API_URL);
    const items = posts.map(toItem).filter((item) => item.title && item.link && item.image);

    const feed = new Feed({
        title: SHOP_NAME,
        link: `${SITE_URL}/category/item/`,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
    });

    for (const item of items) {
        feed.addItem({
            title: item.title,
            link: item.link,
            date: item.date,
            id: item.link,
            description: item.description,
            image: item.image,
        });
    }

    await mkdir(outDir, { recursive: true });
    await writeFile(outFile, feed.rss2(), 'utf8');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
