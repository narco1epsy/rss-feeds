import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHOP_NAME = 'STILL LIFE';
const SHOP_URL = 'https://www.still-life-nagoya.net/shop';
const SITE_URL = 'https://www.still-life-nagoya.net';

function toAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${SITE_URL}${url}`;
    return `${SITE_URL}/${url.replace(/^\.\//, '')}`;
}

function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

function extractImageUrl($root) {
    const candidates = [
        $root.find('img').first().attr('src'),
        $root.find('img').first().attr('data-src'),
        $root.find('img').first().attr('srcset')?.split(',')[0]?.trim().split(' ')[0],
        $root
            .find('[style*="background-image"]')
            .first()
            .attr('style')
            ?.match(/url\(["']?([^"')]+)["']?\)/)?.[1],
    ];

    for (const candidate of candidates) {
        const abs = toAbsoluteUrl(candidate || '');
        if (abs) return abs;
    }
    return '';
}

function extractTitle($root) {
    const aria = normalizeText($root.attr('aria-label'));
    if (aria) {
        return aria
            .replace(/\.\s*NEW.*$/i, '')
            .replace(/NEW.*$/i, '')
            .trim();
    }

    const textCandidates = [
        $root.find('[data-hook="product-item-name"]').first().text(),
        $root.find('[data-hook*="product-title"]').first().text(),
        $root.find('h2, h3').first().text(),
        $root.text(),
    ];

    for (const text of textCandidates) {
        const normalized = normalizeText(text);
        if (normalized) return normalized;
    }
    return '';
}

function extractDescription($root) {
    const textCandidates = [
        $root.find('[data-hook="product-item-price-to-pay"]').first().attr('data-wix-price'),
        $root.find('[data-hook="product-item-price-to-pay"]').first().text(),
        $root.find('[data-hook*="out-of-stock"]').first().text(),
        $root.find('[data-hook*="inventory"]').first().text(),
        $root.find('[data-hook*="ribbon"]').first().text(),
        $root.find('[data-hook*="badge"]').first().text(),
    ];

    for (const text of textCandidates) {
        const normalized = normalizeText(text);
        if (normalized) return normalized;
    }

    const allText = normalizeText($root.text());
    const soldOutMatch = allText.match(/SOLD\s*OUT/i);
    if (soldOutMatch) return soldOutMatch[0];

    return '';
}

async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; RSSBot/1.0; +https://github.com/)',
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }

    return await res.text();
}

function parseProducts(html) {
    const $ = cheerio.load(html);
    const seen = new Set();
    const items = [];

    $('[data-hook="product-item-root"]').each((_, el) => {
        const $item = $(el);
        const link = $item.find('a[href*="/product-page/"]').first().attr('href');
        const url = toAbsoluteUrl(link || '');
        const title = extractTitle($item);
        const image = extractImageUrl($item);
        const description = extractDescription($item);

        if (!title || !url || !image) return;
        if (seen.has(url)) return;
        seen.add(url);

        items.push({
            title,
            url,
            image,
            description,
        });
    });

    return items;
}

async function main() {
    const html = await fetchHtml(SHOP_URL);
    const products = parseProducts(html);

    if (!products.length) {
        throw new Error('No products found');
    }

    const feed = new Feed({
        title: `${SHOP_NAME}`,
        link: SHOP_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
        favicon: `${SITE_URL}/favicon.ico`,
        copyright: `© ${new Date().getFullYear()} ${SHOP_NAME}`,
    });

    for (const product of products) {
        feed.addItem({
            title: product.title,
            link: product.url,
            date: new Date(),
            id: product.url,
            description: product.description,
            image: product.image,
        });
    }

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const docsDir = join(currentDir, '..', 'docs');
    await mkdir(docsDir, { recursive: true });
    await writeFile(join(docsDir, 'still-life-nagoya.xml'), feed.rss2(), 'utf-8');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
