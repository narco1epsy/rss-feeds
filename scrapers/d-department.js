import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'D&DEPARTMENT USED';
const SITE_URL = 'https://www.d-department.com';
const LIST_URL = `${SITE_URL}/category/STORE_USED/`;

const html = await fetchText(LIST_URL);
const $ = cheerio.load(html);

const items = [];

$('article.content-block.item').each((_, article) => {
    const root = $(article);
    const linkEl = root.find('a.content-block-link.item-link').first();
    const imgEl = root.find('.item-image figure img').first();

    const link = normalizeUrl(linkEl.attr('href'), LIST_URL);
    const title = normalizeText(root.find('.item-store-title span').first().text());
    const price = normalizeText(root.find('.item-store-price').first().text());
    const image = normalizeUrl(imgEl.attr('src') || imgEl.attr('data-src') || '', SITE_URL);
    const alt = normalizeText(imgEl.attr('alt') || '');

    const description = [price, alt && alt !== title ? alt : ''].filter(Boolean).join(' / ');

    items.push({
        title,
        link,
        description,
        image,
    });
});

const feed = createFeed({
    title: SHOP_NAME,
    link: LIST_URL,
});

addFeedItems(feed, items);
await writeFeed(import.meta.url, 'd-department.xml', feed);
