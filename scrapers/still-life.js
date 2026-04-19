import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText } from './lib/normalize.js';

const SHOP_NAME = 'STILL LIFE';
const SHOP_URL = 'https://www.still-life-nagoya.net/shop';
const SITE_URL = 'https://www.still-life-nagoya.net';

function extractProductsFromHtml(html) {
    const marker = '"productsWithMetaData":{"list":[';
    const start = html.indexOf(marker);
    if (start === -1) throw new Error('productsWithMetaData.list not found');

    const listStart = start + marker.length - 1;
    let i = listStart;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (; i < html.length; i += 1) {
        const ch = html[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
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

    return JSON.parse(html.slice(listStart, i));
}

const html = await fetchText(SHOP_URL);
const rawProducts = extractProductsFromHtml(html);
const seen = new Set();

const items = rawProducts
    .map((product) => {
        const title = normalizeText(product.name);
        const link = `${SITE_URL}/product-page/${product.urlPart}`;
        const image = product.media?.[0]?.fullUrl || '';
        const description = normalizeText(
            product.formattedPrice || (product.isInStock === false ? 'SOLD OUT' : '')
        );
        return { title, link, description, image };
    })
    .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
    });

const feed = createFeed({ title: SHOP_NAME, link: SHOP_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'still-life-nagoya.xml', feed);
