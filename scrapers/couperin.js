import { getTerms, runWordpressFeed, stripHtml, truncate } from './lib/scrapeWordpress.js';

const SHOP_NAME = 'Couperin';
const SITE_URL = 'https://couperin.net';
const API_URL = `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=100`;
const CATEGORY_ID = 46;

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/`,
    apiUrl: API_URL,
    feedPath: 'couperin.xml',
    filter: (post) => Array.isArray(post?.categories) && post.categories.includes(CATEGORY_ID),
    buildDescription: (post) => {
        const excerpt = stripHtml(post?.excerpt?.rendered || '');
        const content = stripHtml(post?.content?.rendered || '');
        const categories = getTerms(post, 'category');
        const tags = getTerms(post, 'post_tag');

        return [
            truncate(content, 400) || excerpt,
            categories.length ? `カテゴリ: ${categories.join(', ')}` : '',
            tags.length ? `タグ: ${tags.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n\n');
    },
});
