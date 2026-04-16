// scrapers/ideot.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Feed } from 'feed';
import { load } from 'cheerio';

const SHOP_NAME = 'ideot';
const SITE_URL = 'https://ideot.net';
const LIST_URL = `${SITE_URL}/online_shop/`;
const AJAX_URL = `${SITE_URL}/wp/wp-admin/admin-ajax.php`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, '../docs');
const OUT_FILE = path.join(DOCS_DIR, 'ideot.xml');

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 rss-feeds-bot/1.0',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: LIST_URL,
    Origin: SITE_URL,
    'X-Requested-With': 'XMLHttpRequest',
};

const normalize = (text = '') => text.replace(/\s+/g, ' ').trim();

const uniqBy = (items, keyFn) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const fetchListPage = async (page = 1) => {
    const body = new URLSearchParams({
        action: 'filter_posts',
        category: '',
        item_brands: '',
        paged: String(page),
    });

    const res = await fetch(AJAX_URL, {
        method: 'POST',
        headers: REQUEST_HEADERS,
        body,
    });

    if (!res.ok) {
        throw new Error(`AJAX fetch failed: ${res.status} ${res.statusText}`);
    }

    return await res.text();
};

const parseListHtml = (html) => {
    const $ = load(html);

    const items = $('.item_index > li')
        .toArray()
        .map((li) => {
            const article = $(li).children('article').first();
            const mainLink = article.children('a').first();

            const url = mainLink.attr('href')?.trim() || '';
            const image =
                mainLink.find('figure img').attr('src')?.trim() ||
                mainLink.find('figure img').attr('data-src')?.trim() ||
                '';
            const imageAlt = mainLink.find('figure img').attr('alt')?.trim() || '';
            const title = normalize(mainLink.find('.txt_ttl').first().text());
            const soldOutText = normalize(article.find('.txt_status').first().text());
            const soldOut = /sold\s*out|売り切れ|在庫切れ/i.test(soldOutText);

            const categories = article
                .find('.item_category a')
                .toArray()
                .map((a) => normalize($(a).text()))
                .filter(Boolean);

            const brands = article
                .find('.item_brand a')
                .toArray()
                .map((a) => normalize($(a).text()))
                .filter(Boolean);

            const description = [
                soldOut ? 'SOLD OUT' : '',
                categories.length ? `カテゴリ: ${categories.join(', ')}` : '',
                brands.length ? `ブランド: ${brands.join(', ')}` : '',
                imageAlt && imageAlt !== title ? imageAlt : '',
            ]
                .filter(Boolean)
                .join(' / ');

            return {
                title,
                url,
                image,
                soldOut,
                categories,
                brands,
                description,
            };
        })
        .filter((item) => item.url && item.title);

    return uniqBy(items, (item) => item.url);
};

const collectItems = async () => {
    const allItems = [];

    for (let page = 1; page <= 100; page += 1) {
        const html = await fetchListPage(page);
        const items = parseListHtml(html);

        if (items.length === 0) break;

        allItems.push(...items);
    }

    return uniqBy(allItems, (item) => item.url);
};

const buildFeed = (items) => {
    const feed = new Feed({
        title: SHOP_NAME,
        description: `${SHOP_NAME} の新着商品フィード`,
        id: LIST_URL,
        link: LIST_URL,
        language: 'ja',
        updated: new Date(),
        generator: 'feed for Node.js',
        favicon: `${SITE_URL}/favicon.ico`,
    });

    items.forEach((item) => {
        const contentParts = [
            item.soldOut ? '<p>SOLD OUT</p>' : '',
            item.image ? `<p><img src="${item.image}" alt="${item.title}"></p>` : '',
            item.categories.length ? `<p>カテゴリ: ${item.categories.join(', ')}</p>` : '',
            item.brands.length ? `<p>ブランド: ${item.brands.join(', ')}</p>` : '',
        ].filter(Boolean);

        feed.addItem({
            title: item.title,
            id: item.url,
            link: item.url,
            description: item.description || item.title,
            content: contentParts.join(''),
            image: item.image || undefined,
            date: new Date(),
        });
    });

    return feed;
};

const main = async () => {
    await fs.mkdir(DOCS_DIR, { recursive: true });

    const items = await collectItems();
    const feed = buildFeed(items);

    await fs.writeFile(OUT_FILE, feed.rss2(), 'utf-8');
    console.log(`✅ ${items.length}件 → ${OUT_FILE}`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
