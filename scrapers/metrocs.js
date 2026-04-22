import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'METROCS';
const SITE_URL = 'https://metrocs.jp';
const LIST_URL = `${SITE_URL}/itemlist/129?orderby=date`;

const html = await fetchText(LIST_URL);
const $ = cheerio.load(html);

const items = [];

$('.listPage_list_item').each((_, el) => {
    const card = $(el);

    const link = normalizeUrl(card.find('a.listPage_list_item_link').attr('href'), SITE_URL);
    const title = normalizeText(card.find('dt.listPage_list_item_team').first().text());
    const image = normalizeUrl(
        card.find('img.listPage_list_item_link_image_picture').attr('src') || '',
        SITE_URL
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

const feed = createFeed({ title: SHOP_NAME, link: LIST_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'metrocs.xml', feed);
