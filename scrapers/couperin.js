import { runWordpressFeed, getTerms } from './lib/scrapeWordpress.js';
import { stripHtml, joinLines } from './lib/normalize.js';

const SHOP_NAME = 'Couperin';
const SITE_URL = 'https://couperin.net';
const CATEGORY_ID = 46;

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=100&categories=${CATEGORY_ID}`,
    feedPath: 'couperin.xml',
    buildDescription: (post) =>
        joinLines([
            stripHtml(post?.content?.rendered || post?.excerpt?.rendered || ''),
            getTerms(post, 'category').length
                ? `カテゴリ: ${getTerms(post, 'category').join(', ')}`
                : '',
            getTerms(post, 'post_tag').length
                ? `タグ: ${getTerms(post, 'post_tag').join(', ')}`
                : '',
        ]),
});
