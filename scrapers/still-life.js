import { Feed } from 'feed';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHOP_NAME = 'STILL LIFE';
const SHOP_URL = 'https://www.still-life-nagoya.net/shop';
const SITE_URL = 'https://www.still-life-nagoya.net';

function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

function toProductUrl(urlPart) {
    if (!urlPart) return '';
    return `${SITE_URL}/product-page/${urlPart}`;
}

function extractProductsFromHtml(html) {
    const marker = '"productsWithMetaData":{"list":[';
    const start = html.indexOf(marker);
    if (start === -1) {
        throw new Error('productsWithMetaData.list not found');
    }

    const listStart = start + marker.length - 1;
    let i = listStart;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (; i < html.length; i += 1) {
        const ch = html[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === '[') {
            depth += 1;
            continue;
        }

        if (ch === ']') {
            depth -= 1;
            if (depth === 0) {
                i += 1;
                break;
            }
        }
    }

    const listJson = html.slice(listStart, i);
    return JSON.parse(listJson);
}

function mapProduct(product) {
    const title = normalizeText(product.name);
    const url = toProductUrl(product.urlPart);
    const image = product.media?.[0]?.fullUrl || '';
    const description = normalizeText(
        product.formattedPrice || (product.isInStock === false ? 'SOLD OUT' : '')
    );

    if (!title || !url || !image) return null;

    return {
        title,
        url,
        image,
        description,
    };
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

async function main() {
    const html = await fetchHtml(SHOP_URL);
    const rawProducts = extractProductsFromHtml(html);
    const seen = new Set();
    const products = rawProducts.map(mapProduct).filter((product) => {
        if (seen.has(product.url)) return false;
        seen.add(product.url);
        return true;
    });

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
