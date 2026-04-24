import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { fetchText } from './lib/httpClient.js';
import { normalizeText, normalizeUrl } from './lib/normalize.js';

const SHOP_NAME = 'アンティーク家具ラフジュ工房';
const SITE_URL = 'https://rafuju.jp';
const LIST_URL = `${SITE_URL}/products/list.php?orderby=date&disp_number=200&pageno=1`;
const FEED_FILE = 'rafuju.xml';

function extractJsonLd(html) {
    const $ = cheerio.load(html);
    const blocks = $('script[type="application/ld+json"]')
        .toArray()
        .map((el) => el.children?.[0]?.data?.trim() ?? null)
        .filter(Boolean);

    if (!blocks.length) {
        throw new Error('application/ld+json が見つかりません');
    }

    const tryParse = (block) => {
        try {
            return JSON.parse(block);
        } catch {
            return JSON.parse(block.replace(/\\(?!["\\/bfnrtu])/g, '\\\\'));
        }
    };

    const parsed = blocks.flatMap((block) => {
        try {
            return [tryParse(block)];
        } catch (error) {
            console.warn('JSON.parse に失敗した block をスキップします:', error.message);
            return [];
        }
    });

    if (!parsed.length) {
        throw new Error('parse 可能な JSON-LD がありません');
    }

    return parsed;
}

const html = await fetchText(LIST_URL);
const jsonLdList = extractJsonLd(html);

const items = jsonLdList
    .filter((node) => node && !Array.isArray(node) && node['@type'] === 'ItemList')
    .flatMap((node) => node.itemListElement ?? [])
    .map((entry) => {
        const product = entry?.item ?? {};
        const offer = product?.offers ?? {};
        const link = normalizeUrl(product?.url, LIST_URL);
        const image = normalizeUrl(product?.image, LIST_URL);
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

const feed = createFeed({ title: SHOP_NAME, link: SITE_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, FEED_FILE, feed);
