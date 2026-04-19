import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './feedWriter.js';
import { fetchText } from './httpClient.js';
import { normalizeText, normalizeUrl } from './normalize.js';

export async function scrapeBaseShop(config) {
    const html = await fetchText(config.shopUrl);
    const $ = cheerio.load(html);
    const sel = { ...config.selectors };

    const items = [];
    $(sel.itemBox).each((_, el) => {
        const rawUrl = $(el).is(sel.anchor)
            ? $(el).attr('href')
            : $(el).find(sel.anchor).first().attr('href');

        const rawImg = $(el).is(sel.img)
            ? $(el).attr('src')
            : $(el).find(sel.img).first().attr('src');

        const link = normalizeUrl(rawUrl, config.shopUrl);
        const image = normalizeUrl(rawImg, config.shopUrl);
        const title = normalizeText($(el).find(sel.title).text());
        const description = normalizeText($(el).find(sel.price).text());

        items.push({ title, link, date: new Date(), id: link, description, image });
    });

    const feed = createFeed({ title: config.shopName, link: config.shopUrl });
    addFeedItems(feed, items);
    await writeFeed(config.metaUrl, config.feedFile, feed);
}
