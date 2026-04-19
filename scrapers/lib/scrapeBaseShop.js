import { createFeed, addFeedItems, writeFeed } from './feedWriter.js';
import { fetchJson } from './httpClient.js';

export async function runBaseShopFeed({
    metaUrl,
    shopName,
    siteUrl,
    apiUrl,
    feedFile,
    requestHeaders = {},
    buildDescription = () => '',
    buildContent = (item) => item?.description || undefined,
    mapLink = (item) => item?.url || '',
    mapId = (item) => mapLink(item),
}) {
    const rows = await fetchJson(apiUrl, requestHeaders);
    const feed = createFeed({ title: shopName, link: siteUrl });

    const items = rows.map((item) => ({
        title: item?.title || '',
        link: mapLink(item),
        id: mapId(item),
        description: buildDescription(item),
        content: buildContent(item),
        image: item?.images?.[0]?.origin || undefined,
    }));

    addFeedItems(feed, items);
    return await writeFeed(metaUrl, feedFile, feed);
}
