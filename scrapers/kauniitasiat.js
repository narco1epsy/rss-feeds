import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'kauniit asiat';
const SHOP_URL = 'https://kauniitasiat.official.ec';

const html = await fetchText(SHOP_URL);
const $ = cheerio.load(html);

const items = [];

$('a[href*="/items/"]').each((_, el) => {
    const $a = $(el);
    const link = normalizeUrl($a.attr('href') || '', SHOP_URL);

    if (!link || !/\/items\/\d+/.test(link)) return;

    const title =
        normalizeText($a.find('[class*="itemTitleText"]').first().text()) ||
        normalizeText($a.find('[class*="itemTitle"]').first().text()) ||
        normalizeText($a.attr('title') || '');

    const price =
        normalizeText($a.find('[class*="price"]').first().text()) || normalizeText($a.text());

    const rawImg =
        $a.find('img').first().attr('src') ||
        $a.find('img').first().attr('data-src') ||
        $a.find('img').first().attr('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
        '';

    const image = normalizeUrl(rawImg, SHOP_URL);

    items.push({
        title,
        link,
        date: new Date(),
        id: link,
        description: price,
        image,
    });
});

const seen = new Set();
const uniqueItems = items.filter((item) => {
    if (!item.title || !item.link || !item.image) return false;
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
});

const feed = createFeed({ title: SHOP_NAME, link: SHOP_URL });
addFeedItems(feed, uniqueItems);
await writeFeed(import.meta.url, 'kauniitasiat.xml', feed);
