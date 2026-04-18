import { getTerms, runWordpressFeed, stripHtml, truncate } from './lib/scrapeWordpress.js';

const SHOP_NAME = 'Graphio/büro-stil';
const SITE_URL = 'https://graphio-buro.com';
const API_URL = `${SITE_URL}/wp-json/wp/v2/selections?_embed&per_page=100`;

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/selections/`,
    apiUrl: API_URL,
    feedPath: 'graphio-buro.xml',
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
