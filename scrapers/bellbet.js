import { runWordpressFeed, getTerms } from './lib/scrapeWordpress.js';

const SHOP_NAME = 'BELLBET';
const SITE_URL = 'https://www.bellbet.net/stock';

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=100`,
    feedFile: 'bellbet.xml',
    buildDescription: (post) => {
        const categories = getTerms(post, 'category');
        const tags = getTerms(post, 'post_tag').filter((t) => t !== 'none');
        return [...categories, ...tags].join(' / ') || undefined;
    },
});
