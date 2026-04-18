import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Feed } from 'feed';

const SHOP_NAME = 'stoop';
const SITE_URL = 'https://stoop.jp';
const API_URL = `${SITE_URL}/wp-json/wp/v2/collection?_embed&per_page=100`;
const FEED_PATH = 'stoop.xml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, '../docs');
const outputFile = path.join(docsDir, FEED_PATH);

const decodeHtml = (text = '') =>
    text
        .replace(/&#038;/g, '&')
        .replace(/&#8217;/g, '’')
        .replace(/&#8211;/g, '–')
        .replace(/&#8220;/g, '“')
        .replace(/&#8221;/g, '”')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();

const stripHtml = (html = '') => decodeHtml(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));

const pickImage = (item) => {
    const media = item?._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return '';
    return (
        media?.media_details?.sizes?.full?.source_url ||
        media?.source_url ||
        media?.guid?.rendered ||
        ''
    );
};

const extractTerms = (item) => {
    const groups = item?._embedded?.['wp:term'] || [];
    const terms = [];
    for (const group of groups) {
        for (const term of group) {
            if (term?.taxonomy && term?.name) {
                terms.push({ taxonomy: term.taxonomy, name: decodeHtml(term.name) });
            }
        }
    }
    return terms;
};

const buildDescription = (item) => {
    const lines = [];
    const terms = extractTerms(item);
    const taxonomyOrder = [
        'genre',
        'maker',
        'creator',
        'artists',
        'focus_on',
        'genre2',
        'period',
        'country',
    ];

    for (const taxonomy of taxonomyOrder) {
        const names = terms.filter((t) => t.taxonomy === taxonomy).map((t) => t.name);
        if (names.length) lines.push(`${taxonomy}: ${names.join(', ')}`);
    }

    if (item.class_list?.length) {
        const badges = item.class_list.filter(
            (v) =>
                !/^post-\d+$/.test(v) &&
                v !== 'collection' &&
                v !== 'type-collection' &&
                v !== 'status-publish' &&
                v !== 'hentry'
        );
        if (badges.length) lines.push(`class: ${badges.join(', ')}`);
    }

    if (item.modified) lines.push(`modified: ${item.modified}`);
    if (item.date) lines.push(`published: ${item.date}`);

    const excerpt = stripHtml(item.excerpt?.rendered || item.content?.rendered || '');
    if (excerpt) lines.push(excerpt);

    return lines.join('\n');
};

const fetchItems = async () => {
    const res = await fetch(API_URL, {
        headers: {
            'user-agent': 'rss-feeds/1.0 (+GitHub Actions)',
            accept: 'application/json',
        },
    });

    if (!res.ok) {
        throw new Error(`Failed request: ${res.status} ${res.statusText}`);
    }

    return res.json();
};

const main = async () => {
    await fs.mkdir(docsDir, { recursive: true });
    const items = await fetchItems();

    const feed = new Feed({
        title: SHOP_NAME,
        link: `${SITE_URL}/collection`,
        description: `${SHOP_NAME} の新着商品フィード`,
        language: 'ja',
        favicon: `${SITE_URL}/wp-content/uploads/2020/05/cropped-fabicon-gray-32x32.png`,
    });

    for (const item of items) {
        const title = item.title?.rendered;
        const link = item.link || `${SITE_URL}/collection/${item.id}`;
        const image = pickImage(item);
        if (!title || !link || !image) continue;

        feed.addItem({
            title,
            link,
            date: new Date(item.modified || item.date || Date.now()),
            id: link,
            description: buildDescription(item),
            image,
        });
    }

    await fs.writeFile(outputFile, feed.rss2(), 'utf8');
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
