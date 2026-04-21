import { createFeed, addFeedItems, writeFeed } from './feedWriter.js';
import { fetchText } from './httpClient.js';
import { normalizeText } from './normalize.js';

function extractJsonScript(html, id) {
    const marker = `<script type="application/json" id="${id}">`;
    const start = html.indexOf(marker);
    if (start === -1) throw new Error(`${id} script not found`);

    const contentStart = start + marker.length;
    const end = html.indexOf('</script>', contentStart);
    if (end === -1) throw new Error(`${id} script is not closed`);

    return html.slice(contentStart, end);
}

function findProductsWithMetaData(node) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node?.productsWithMetaData?.list)) {
        return node.productsWithMetaData.list;
    }

    for (const value of Object.values(node)) {
        const found = findProductsWithMetaData(value);
        if (found) return found;
    }
    return null;
}

export function extractWixProducts(html) {
    const raw = extractJsonScript(html, 'wix-warmup-data');
    const data = JSON.parse(raw);
    const products = findProductsWithMetaData(data);

    if (!Array.isArray(products) || products.length === 0) {
        throw new Error('productsWithMetaData.list not found');
    }
    return products;
}

export async function runWixStoreFeed({ metaUrl, shopName, shopUrl, siteUrl, feedFile }) {
    const html = await fetchText(shopUrl);
    const rawProducts = extractWixProducts(html);
    const seen = new Set();

    const items = rawProducts
        .map((p) => ({
            title: normalizeText(p.name),
            link: `${siteUrl}/product-page/${p.urlPart}`,
            image: p.media?.[0]?.fullUrl ?? undefined,
            description: normalizeText(
                p.isInStock === false ? 'SOLD OUT' : (p.formattedPrice ?? '')
            ),
        }))
        .filter(({ link }) => !seen.has(link) && seen.add(link));

    const feed = createFeed({ title: shopName, link: shopUrl });
    addFeedItems(feed, items);
    return writeFeed(metaUrl, feedFile, feed);
}
