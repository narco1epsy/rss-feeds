import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Feed } from 'feed';

const SHOP_NAME = 'ELEPHANT';
const SITE_URL = 'https://elephant-life.com';
const FEED_PATH = 'elephant-life.xml';
const API_URL = `${SITE_URL}/collections/all/products.json?limit=250`;

async function fetchProducts() {
    const res = await fetch(API_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +https://github.com/)',
            Accept: 'application/json,text/plain,*/*',
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return products.sort((a, b) => {
        const at = a?.published_at ? new Date(a.published_at).getTime() : 0;
        const bt = b?.published_at ? new Date(b.published_at).getTime() : 0;
        return bt - at;
    });
}

function firstImage(product) {
    return product?.images?.[0]?.src || product?.image?.src || '';
}

function productUrl(product) {
    return `${SITE_URL}/products/${product.handle}`;
}

function htmlToPlainText(html = '') {
    return String(html)
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\/p\s*>/gi, '\n\n')
        .replace(/<\/div\s*>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '- ')
        .replace(/<\/li\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function buildMetaDescription(product) {
    const parts = [];
    if (product.vendor) parts.push(`ブランド: ${product.vendor}`);
    if (product.product_type) parts.push(`カテゴリ: ${product.product_type}`);
    if (Array.isArray(product.tags) && product.tags.length) {
        parts.push(`タグ: ${product.tags.join(', ')}`);
    } else if (typeof product.tags === 'string' && product.tags.trim()) {
        parts.push(`タグ: ${product.tags}`);
    }
    const variant = product?.variants?.[0];
    if (variant?.price) parts.push(`価格: ${variant.price}`);
    return parts.join('\n');
}

async function main() {
    const products = await fetchProducts();

    const feed = new Feed({
        title: SHOP_NAME,
        link: SITE_URL,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
        favicon: `${SITE_URL}/favicon.ico`,
        copyright: `© ${new Date().getFullYear()} ${SHOP_NAME}`,
    });

    for (const product of products) {
        const image = firstImage(product);
        const url = productUrl(product);
        const published = product.published_at ? new Date(product.published_at) : new Date();
        const bodyText = htmlToPlainText(product.body_html || '');
        const metaText = buildMetaDescription(product);
        const textBlock = [bodyText, metaText].filter(Boolean).join('\n\n');
        const contentHtml = textBlock
            ? textBlock
                  .split('\n')
                  .map((line) => line || '<br>')
                  .join('<br>')
            : '';

        feed.addItem({
            title: product.title,
            link: url,
            date: published,
            id: url,
            // description: textBlock,
            content: contentHtml,
            image,
        });
    }

    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const docsDir = path.resolve(currentDir, '../docs');
    const outPath = path.join(docsDir, FEED_PATH);
    await writeFile(outPath, feed.rss2(), 'utf8');
    console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
