import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOPNAME = 'METROCS';
const SITEURL = 'https://metrocs.jp';
const LISTURL = `${SITEURL}/itemlist/129?orderby=date`;

const html = await fetchText(LISTURL);
const $ = cheerio.load(html);

const items = [];

$('.listPage_list_item').each((_, el) => {
    const card = $(el);

    const rawHref = card.find('a.listPage_list_item_link').attr('href');
    const link = normalizeUrl(rawHref, SITEURL);

    const title = normalizeText(card.find('dt.listPage_list_item_team').first().text());

    const image = normalizeUrl(
        card.find('img.listPage_list_item_link_image_picture').attr('src'),
        SITEURL
    );

    const price = normalizeText(card.find('.productList_item_price_amount').first().text());

    const labels = card
        .find('.listPage_list_item_label li span')
        .toArray()
        .map((el) => normalizeText($(el).text()))
        .filter(Boolean)
        .join(', ');

    const description = [labels, price].filter(Boolean).join(' / ');

    items.push({ title, link, description, image });
});

const feed = createFeed({ title: SHOPNAME, link: LISTURL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'metrocs.xml', feed);
