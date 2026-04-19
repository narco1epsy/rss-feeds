import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Feed } from 'feed';

export function resolveDocsPath(metaUrl, fileName) {
    const currentFile = fileURLToPath(metaUrl);
    const currentDir = path.dirname(currentFile);
    return path.resolve(currentDir, '../docs', fileName);
}

export function createFeed({ title, link }) {
    return new Feed({
        title,
        link,
        description: `${title} の新着商品フィード`,
        language: 'ja',
    });
}

export function addFeedItems(feed, items) {
    for (const item of items) {
        if (!item?.title || !item?.link || !item?.image) continue;

        feed.addItem({
            title: item.title,
            link: item.link,
            date: item.date || new Date(),
            id: item.link || item.id,
            description: item.description || '',
            content: item.content || undefined,
            image: item.image,
        });
    }

    return feed;
}

export async function writeFeed(metaUrl, fileName, feed) {
    const outPath = resolveDocsPath(metaUrl, fileName);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, feed.rss2(), 'utf-8');
    return outPath;
}
