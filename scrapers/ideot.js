import * as cheerio from 'cheerio';
import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { postForm } from './lib/httpClient.js';
import { normalizeText } from './lib/normalize.js';

const SHOP_NAME = 'ideot';
const SITE_URL = 'https://ideot.net';
const LIST_URL = `${SITE_URL}/online_shop/`;
const AJAX_URL = `${SITE_URL}/wp/wp-admin/admin-ajax.php`;

const html = await postForm(
    AJAX_URL,
    { action: 'filter_posts', category: '', item_brands: '', paged: '1' },
    { Referer: LIST_URL, Origin: SITE_URL, 'X-Requested-With': 'XMLHttpRequest' }
);

const $ = cheerio.load(html);
const items = [];

$('.item_index > li').each((_, li) => {
    const article = $(li).children('article').first();
    const mainLink = article.children('a').first();
    const url = mainLink.attr('href')?.trim() || '';
    const image =
        mainLink.find('figure img').attr('src')?.trim() ||
        mainLink.find('figure img').attr('data-src')?.trim() ||
        '';
    const title = normalizeText(mainLink.find('.txt_ttl').first().text());
    const categories = article
        .find('.item_category a')
        .toArray()
        .map((a) => normalizeText($(a).text()))
        .filter(Boolean);
    const brands = article
        .find('.item_brand a')
        .toArray()
        .map((a) => normalizeText($(a).text()))
        .filter(Boolean);
    const alt = mainLink.find('figure img').attr('alt')?.trim() || '';
    const description = [
        categories.length ? `カテゴリ: ${categories.join(', ')}` : '',
        brands.length ? `ブランド: ${brands.join(', ')}` : '',
        alt && alt !== title ? alt : '',
    ]
        .filter(Boolean)
        .join(' / ');

    items.push({ title, link: url, date: new Date(), description, image });
});

const feed = createFeed({ title: SHOP_NAME, link: LIST_URL });
addFeedItems(feed, items);
await writeFeed(import.meta.url, 'ideot.xml', feed);
