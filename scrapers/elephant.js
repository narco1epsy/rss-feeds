import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchJson } from './lib/httpClient.js';
import { joinLines } from './lib/normalize.js';

const SHOP_NAME = 'ELEPHANT';
const SITE_URL = 'https://elephant-life.com';
const API_URL = `${SITE_URL}/collections/all/products.json?limit=250`;

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
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const data = await fetchJson(API_URL, {
    Accept: 'application/json,text/plain,*/*',
});
const products = Array.isArray(data?.products) ? data.products : [];
products.sort((a, b) => new Date(b?.published_at || 0) - new Date(a?.published_at || 0));

const items = products.map((product) => {
    const variant = product?.variants?.[0];
    const description = joinLines([
        htmlToPlainText(product?.body_html || ''),
        product?.vendor ? `ブランド: ${product.vendor}` : '',
        product?.product_type ? `カテゴリ: ${product.product_type}` : '',
        Array.isArray(product?.tags) && product.tags.length
            ? `タグ: ${product.tags.join(', ')}`
            : '',
        variant?.price ? `価格: ${variant.price}` : '',
    ]);

    return {
        title: product.title || '',
        link: `${SITE_URL}/products/${product.handle}`,
        date: new Date(product.published_at || Date.now()),
        id: `${SITE_URL}/products/${product.handle}`,
        description,
        image: product?.images?.[0]?.src || product?.image?.src || '',
    };
});

const feed = createFeed({ title: SHOP_NAME, link: SITE_URL });
addFeedItems(feed, items);
const outPath = await writeFeed(import.meta.url, 'elephant-life.xml', feed);
console.log(`✅ ${items.length}件 → ${outPath}`);
