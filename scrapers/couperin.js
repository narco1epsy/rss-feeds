// scrapers/couperin.js
import { load } from 'cheerio';
import { Feed } from 'feed';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SHOP_NAME = 'Couperin';
const LIST_URL = 'https://couperin.net/category/item/';

async function fetchHtml(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
    return await res.text();
}

function absUrl(url) {
    return new URL(url, LIST_URL).toString();
}

function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function isItemUrl(url) {
    const u = absUrl(url);
    const path = new URL(u).pathname;
    if (!path || path === '/') return false;
    if (path.startsWith('/category/')) return false;
    if (path.startsWith('/about/')) return false;
    if (path.startsWith('/shopping-guide/')) return false;
    if (path.startsWith('/usces-cart/')) return false;
    if (path.startsWith('/wp-')) return false;
    if (path.startsWith('/tag/')) return false;
    return true;
}

function extractTitle(text) {
    const cleaned = normalizeText(text)
        .replace(/\s*更に詳しく読む\s*/g, ' ')
        .replace(/\s*\(ご注文可能\)\s*/g, ' ')
        .trim();

    const parts = cleaned.split(' ');
    if (parts.length <= 1) return cleaned;

    let title = parts[0];
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (/[\u3040-\u30ff\u3400-\u9fff]/.test(part)) break;
        if (/^[A-Z][a-z]+$/.test(part) || /^[A-Z0-9][A-Za-z0-9'’.,:/-]*$/.test(part)) {
            title += ` ${part}`;
            continue;
        }
        title += ` ${part}`;
    }
    return title.trim();
}

function extractDescription(text) {
    const cleaned = normalizeText(text);

    const body = cleaned
        .replace(/\s*更に詳しく読む\s*/g, ' ')
        .replace(/\s*\(ご注文可能\)\s*/g, ' ')
        .trim();

    const title = extractTitle(body);
    const summary = body.startsWith(title) ? body.slice(title.length).trim() : body;

    return [summary].filter(Boolean).join('\n');
}

function extractItems(html) {
    const $ = load(html);
    const seen = new Set();
    const items = [];

    $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        if (!href || !isItemUrl(href)) return;
        if (!$(a).find('img').length) return;

        const link = absUrl(href);
        if (seen.has(link)) return;

        const text = normalizeText($(a).text());
        if (!text || !text.includes('更に詳しく読む')) return;

        const imageSrc = $(a).find('img').first().attr('src');
        const imageUrl = imageSrc ? absUrl(imageSrc) : null;
        const title = extractTitle(text);
        const description = extractDescription(text);

        if (!title) return;

        seen.add(link);
        items.push({
            title,
            link,
            description,
            imageUrl,
        });
    });

    return items;
}

async function main() {
    const html = await fetchHtml(LIST_URL);
    const items = extractItems(html);

    const feed = new Feed({
        title: `${SHOP_NAME}`,
        link: LIST_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
    });

    for (const item of items) {
        feed.addItem({
            title: item.title,
            link: item.link,
            date: new Date(),
            id: item.link,
            description: item.description,
            image: item.imageUrl || undefined,
        });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outDir = resolve(__dirname, '../docs');

    await mkdir(outDir, { recursive: true });
    await writeFile(resolve(outDir, 'couperin.xml'), feed.rss2(), 'utf-8');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
