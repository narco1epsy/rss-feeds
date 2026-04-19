// scrapers/rafuju.js
import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOPNAME = 'アンティーク家具ラフジュ工房';
const LISTURL = 'https://rafuju.jp/products/list.php?orderby=date&disp_number=200&pageno=1';
const FEEDFILE = 'rafuju.xml';

function extractJsonLd(html) {
    const $ = cheerio.load(html);
    const blocks = $('script[type="application/ld+json"]')
        .toArray()
        .map((el) => $(el).html()?.trim())
        .filter(Boolean);

    if (!blocks.length) {
        throw new Error('application/ld+json が見つかりません');
    }

    const parsed = [];

    for (const block of blocks) {
        try {
            parsed.push(JSON.parse(block));
        } catch (error) {
            console.warn('JSON.parse に失敗した block をスキップします');
        }
    }

    if (!parsed.length) {
        throw new Error('parse 可能な JSON-LD がありません');
    }

    return parsed;
}

const html = await fetchText(LISTURL);
const jsonLdList = extractJsonLd(html);

const items = jsonLdList
    .filter((node) => node && !Array.isArray(node) && node['@type'] === 'ItemList')
    .flatMap((node) => node.itemListElement ?? [])
    .map((entry) => {
        const product = entry?.item ?? {};
        const offer = product?.offers ?? {};
        const link = normalizeUrl(product?.url, LISTURL);
        const image = normalizeUrl(product?.image, LISTURL);
        const title = normalizeText(product?.name ?? product?.sku ?? '');
        const price = offer?.price ? `¥${offer.price}` : '';
        const condition = offer?.itemCondition
            ? offer.itemCondition.replace('https://schema.org/', '')
            : '';
        const availability = offer?.availability
            ? offer.availability.replace('https://schema.org/', '')
            : '';

        return {
            title,
            link,
            description: [product?.sku, price, condition, availability].filter(Boolean).join(' / '),
            image,
        };
    });

const feed = createFeed({ title: SHOPNAME, link: LISTURL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, FEEDFILE, feed);
