import { runWordpressFeed, getTerms } from './lib/scrapeWordpress.js';
import { stripHtml, joinLines } from './lib/normalize.js';

const SHOP_NAME = 'Graphio/büro-stil';
const SITE_URL = 'https://graphio-buro.com';

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/selections/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/selections?_embed&per_page=100`,
    feedPath: 'graphio-buro.xml',
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
