import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'LET EM IN';
const SHOP_URL = 'https://letemin.jp/shopping';

const html = await fetchText(SHOP_URL);
const $ = cheerio.load(html);

const items = [];

$('#shopArchive li').each((_, el) => {
    const figure = $(el).find('figure.shopArchiveThumb');
    const link = normalizeUrl(figure.find('p.shopArchiveThumbLink a').attr('href'), SHOP_URL);
    const imgEl = figure.find('img');
    const srcset = imgEl.attr('srcset') ?? '';
    const lastSrcset = srcset
        .split(',')
        .map((s) => s.trim().split(' ')[0])
        .filter(Boolean)
        .pop();
    const rawSrc = imgEl.attr('src') ?? '';
    const image = lastSrcset ?? rawSrc.replace(/-\d+x\d+(\.\w+)$/, '$1');
    const title = normalizeText(figure.find('figcaption p').eq(0).text());
    const priceText = normalizeText(figure.find('figcaption p').eq(1).text());

    items.push({
        title,
        link,
        description: priceText || undefined,
        image,
    });
});

const feed = createFeed({ title: SHOP_NAME, link: SHOP_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'letemin.xml', feed);
