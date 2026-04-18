import { runWordpressFeed, getTerms } from './lib/scrapeWordpress.js';
import { stripHtml, truncate, joinLines } from './lib/normalize.js';

const SHOP_NAME = 'Couperin';
const SITE_URL = 'https://couperin.net';
const CATEGORY_ID = 46;

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=100`,
    feedPath: 'couperin.xml',
    filter: (post) => Array.isArray(post?.categories) && post.categories.includes(CATEGORY_ID),
    buildDescription: (post) =>
        joinLines([
            truncate(stripHtml(post?.content?.rendered || ''), 400) ||
                stripHtml(post?.excerpt?.rendered || ''),
            getTerms(post, 'category').length
                ? `カテゴリ: ${getTerms(post, 'category').join(', ')}`
                : '',
            getTerms(post, 'post_tag').length
                ? `タグ: ${getTerms(post, 'post_tag').join(', ')}`
                : '',
        ]),
});
