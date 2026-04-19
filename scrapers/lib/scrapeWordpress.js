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
    feedFile,
    requestHeaders = {},
    buildDescription = () => '',
    buildContent = () => undefined,
    mapLink = (item) => item?.link || '',
    mapDate = (item) => new Date(item?.date || item?.modified || Date.now()),
    mapId = (item) => mapLink(item),
}) {
    const rows = await fetchJson(apiUrl, requestHeaders);
    const feed = createFeed({ title: shopName, link: siteUrl });

    const items = rows.map((item) => ({
        title: stripHtml(item?.title?.rendered || ''),
        link: mapLink(item),
        date: mapDate(item),
        id: mapId(item),
        description: buildDescription(item),
        content: buildContent(item),
        image: getImage(item),
    }));

    addFeedItems(feed, items);
    return await writeFeed(metaUrl, feedFile, feed);
}
