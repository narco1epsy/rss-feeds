import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './feedWriter.js';
import { fetchText } from './httpClient.js';
import { normalizeText, normalizeUrl } from './normalize.js';

export async function scrapeBaseShop(config) {
    const html = await fetchText(config.shopUrl, {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
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

        if (!title || !link || !image) return;

        items.push({
            title,
            link,
            date: new Date(),
            id: link,
            description,
            image,
        });
    });

    const feed = createFeed({
        title: config.feedTitle,
        link: config.shopUrl,
        description: config.feedDesc,
    });

    addFeedItems(feed, items);
    const outPath = await writeFeed(config.metaUrl, config.outputFile, feed);
    console.log(`✅ ${items.length}件 → ${outPath}`);
}
