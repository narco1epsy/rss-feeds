import { createFeed, addFeedItems, writeFeed } from './feedWriter.js';
import { fetchJson } from './httpClient.js';
import { stripHtml } from './normalize.js';

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

export async function runWordpressFeed({
    metaUrl,
    shopName,
    siteUrl,
    apiUrl,
    feedPath,
    requestHeaders = {},
    buildDescription = () => '',
    mapLink = (item) => item?.link || '',
    mapDate = (item) => new Date(item?.modified || item?.date || Date.now()),
    mapId = (item) => String(item?.link || item?.id || ''),
}) {
    const rows = await fetchJson(apiUrl, requestHeaders);
    const feed = createFeed({
        title: shopName,
        link: siteUrl,
    });

    const items = rows.map((item) => {
        const title = stripHtml(item?.title?.rendered || '');
        const link = mapLink(item);
        const date = mapDate(item);
        const id = mapId(item);
        const description = buildDescription(item);
        const image = getImage(item);

        return {
            title,
            link,
            date,
            id,
            description,
            image,
        };
    });

    addFeedItems(feed, items);
    return await writeFeed(metaUrl, feedPath, feed);
}
