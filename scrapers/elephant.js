import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchJson } from './lib/httpClient.js';

const SHOP_NAME = 'ELEPHANT';
const SITE_URL = 'https://elephant-life.com';
const API_URL = `${SITE_URL}/collections/all/products.json?limit=250`;

const data = await fetchJson(API_URL, {
    Accept: 'application/json,text/plain,*/*',
});
const products = Array.isArray(data?.products) ? data.products : [];
products.sort((a, b) => new Date(b?.published_at || 0) - new Date(a?.published_at || 0));

const items = products.map((product) => ({
    title: product.title || '',
    link: `${SITE_URL}/products/${product.handle}`,
    date: new Date(product.published_at || Date.now()),
    content: product.body_html || undefined,
    image: product?.images?.[0]?.src || product?.image?.src || '',
}));

const feed = createFeed({ title: SHOP_NAME, link: SITE_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'elephant-life.xml', feed);
