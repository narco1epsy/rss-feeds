import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = '北欧家具talo';
const SHOP_URL = 'https://www.talo.tv';

const html = await fetchText(SHOP_URL);
const $ = cheerio.load(html);

const $newArrival = $('section.top-section').first().find('ul.m-item-list');
const items = [];

$newArrival.find('li').each((_, el) => {
    const $a = $(el).find('a.m-item-unit');
    const href = $a.attr('href') || '';
    const link = normalizeUrl(href, SHOP_URL);
    const image = $a.find('img.m-item-unit__img').attr('src') || '';
    const title = normalizeText($a.find('.m-item-unit__name').text());
    const itemNum = $a.find('.m-item-unit__num').text().trim();
    const price = $a.find('.m-item-unit__price').text().trim();
    const tax = $a.find('.m-item-unit__tax').text().trim();

    items.push({
        title,
        link,
        date: new Date(),
        description: `${itemNum} ${price}${tax}`.trim(),
        image,
    });
});

const feed = createFeed({ title: SHOP_NAME, link: SHOP_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'talo.xml', feed);
