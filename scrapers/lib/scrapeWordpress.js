import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Feed } from 'feed';
import * as cheerio from 'cheerio';

export function resolveDocsPath(metaUrl, fileName) {
    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, '../docs', fileName);
}

export async function fetchJson(url, headers = {}) {
    const res = await fetch(url, {
        headers: {
            accept: 'application/json',
            'user-agent': 'rss-feeds-bot/1.0 (+GitHub Actions)',
            ...headers,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed request: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export function stripHtml(html = '') {
    const $ = cheerio.load(html || '');
    return $.text().replace(/\s+/g, ' ').trim();
}

export function truncate(text = '', max = 400) {
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export function getFeaturedImage(item) {
    const media = item?._embedded?.['wp:featuredmedia']?.[0];
    return (
        media?.media_details?.sizes?.full?.source_url ||
        media?.source_url ||
        media?.guid?.rendered ||
        ''
    );
}

export function getContentImage(item) {
    const html = item?.content?.rendered || '';
    const matched = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return matched?.[1] || '';
}

export function getImage(item) {
    return getFeaturedImage(item) || getContentImage(item);
}

export function getTerms(item, taxonomy) {
    const groups = item?._embedded?.['wp:term'] || [];
    return groups
        .flat()
        .filter((term) => term?.taxonomy === taxonomy && term?.name)
        .map((term) => stripHtml(term.name));
}

export function createFeed({ shopName, siteUrl }) {
    return new Feed({
        title: shopName,
        link: siteUrl,
        description: `${shopName} の新着商品フィード`,
        language: 'ja',
    });
}

export async function writeFeed(metaUrl, feedPath, xml) {
    const outputPath = resolveDocsPath(metaUrl, feedPath);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, xml, 'utf-8');
    return outputPath;
}

export async function runWordpressFeed({
    metaUrl,
    shopName,
    siteUrl,
    apiUrl,
    feedPath,
    requestHeaders = {},
    filter = () => true,
    buildDescription = () => '',
    mapLink = (item) => item?.link || '',
    mapDate = (item) => new Date(item?.modified || item?.date || Date.now()),
    mapId = (item) => String(item?.link || item?.id || ''),
}) {
    const items = await fetchJson(apiUrl, requestHeaders);
    const feed = createFeed({ shopName, siteUrl });

    for (const item of items.filter(filter)) {
        const title = stripHtml(item?.title?.rendered || '');
        const link = mapLink(item);
        const date = mapDate(item);
        const id = mapId(item);
        const image = getImage(item);
        const description = buildDescription(item);

        if (!title || !link || !image) continue;

        feed.addItem({
            title,
            link,
            date,
            id,
            description,
            image,
        });
    }

    return writeFeed(metaUrl, feedPath, feed.rss2());
}
