import { runWordpressFeed, getTerms } from './lib/scrapeWordpress.js';

const SHOP_NAME = 'stoop';
const SITE_URL = 'https://stoop.jp';

await runWordpressFeed({
    metaUrl: import.meta.url,
    shopName: SHOP_NAME,
    siteUrl: `${SITE_URL}/collection`,
    apiUrl: `${SITE_URL}/wp-json/wp/v2/collection?_embed&per_page=100`,
    feedPath: 'stoop.xml',
    buildDescription: (item) => {
        const taxonomies = [
            'genre',
            'maker',
            'creator',
            'artists',
            'focus_on',
            'genre2',
            'period',
            'country',
        ];
        return taxonomies
            .map((taxonomy) => {
                const names = getTerms(item, taxonomy);
                return names.length ? `${taxonomy}: ${names.join(', ')}` : '';
            })
            .filter(Boolean)
            .join('\n');
    },
});
