import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'Wormhole Furniture';
const SITE_URL = 'https://www.wormholefurniture.com';
const LIST_URL = `${SITE_URL}/shoping`;

const html = await fetchText(LIST_URL);
const $ = cheerio.load(html);
const items = [];

$('.j-catalog-product').each((_, el) => {
    const linkEl = $(el).find('a.j-catalog-product-image-link').first();
    const rawUrl = linkEl.attr('href') || '';
    const link = normalizeUrl(rawUrl, SITE_URL);

    const title = normalizeText($(el).find('a.j-catalog-product-title-link').text());

    const imgEl = $(el).find('img.j-webview-product-image').first();
    const rawImage =
        imgEl.attr('srcset')?.split(',')[0]?.trim()?.split(/\s+/)[0] ||
        imgEl.attr('src') ||
        imgEl.attr('data-src') ||
        '';
    const image = rawImage.replace(/\/transf\/[^/]+\//, '/transf/none/');

    const price = normalizeText($(el).find('.j-catalog-price').text());
    const description = $(el).find('.j-catalog-product-description').attr('data-description') || '';

    items.push({
        title,
        link,
        image,
        description: [price ? `¥${price}` : '', description].filter(Boolean).join(' / '),
    });
});

const feed = createFeed({ title: SHOP_NAME, link: LIST_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'wormhole-furniture.xml', feed);
