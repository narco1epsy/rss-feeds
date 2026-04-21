import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'HOMEWARD';
const SITE_URL = 'https://www.home-ward.net';
const LIST_URL = `${SITE_URL}/products/list.php?orderby=date&disp_number=90`;

const html = await fetchText(LIST_URL);
const $ = cheerio.load(html);
const items = [];

$('div.list_area').each((_, el) => {
    const a = $(el).find('div.item_image a').first();
    const rawHref = a.attr('href') || '';
    const link = normalizeUrl(rawHref, SITE_URL);
    if (!link) return;

    const title = normalizeText($(el).find('h3 a').text());
    if (!title) return;

    const image = normalizeUrl($(el).find('div.item_image img').attr('src') || '', SITE_URL);

    const priceEl = $(el).find('span[id^="price02_default"]').first();
    const priceText = normalizeText(priceEl.text().replace(/[,，]/g, ''));
    const description = priceText ? `¥${priceText}` : '';

    items.push({ title, link, description, image });
});

const feed = createFeed({ title: SHOP_NAME, link: LIST_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'homeward.xml', feed);
