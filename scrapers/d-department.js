import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOPNAME = 'D&DEPARTMENT USED';
const SITEURL = 'https://www.d-department.com';
const LISTURL = `${SITEURL}/category/STORE_USED/`;

const html = await fetchText(LISTURL);
const $ = cheerio.load(html);

const items = [];

$('article.content-block.item').each((_, article) => {
    const root = $(article);
    const linkEl = root.find('a.content-block-link.item-link').first();
    const imgEl = root.find('.item-image figure img').first();

    const link = normalizeUrl(linkEl.attr('href'), LISTURL);
    const title = normalizeText(root.find('.item-store-title span').first().text());
    const price = normalizeText(root.find('.item-store-price').first().text());
    const image = normalizeUrl(imgEl.attr('src') || imgEl.attr('data-src'), SITEURL);
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
    title: SHOPNAME,
    link: LISTURL,
});

addFeedItems(feed, items);
await writeFeed(import.meta.url, 'd-department.xml', feed);
