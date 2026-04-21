import { createFeed, addFeedItems, writeFeed } from './lib/feedWriter.js';
import { postGraphQL } from './lib/httpClient.js';
import { normalizeText, normalizeDate } from './lib/normalize.js';

const SHOP_NAME = 'ambiant';
const SITE_URL = 'https://ambiant.jp';
const COLLECTION_URL = `${SITE_URL}/collections/antiques`;
const API_URL = `${SITE_URL}/api/2024-01/graphql.json`;
const STOREFRONT_TOKEN = '9ae7f5d83648ec4d45654360be9a86fb';

const QUERY = `{
  collection(handle: "antiques") {
    products(first: 250) {
      nodes {
        id
        title
        handle
        availableForSale
        publishedAt
        description(truncateAt: 200)
        onlineStoreUrl
        featuredImage { url altText }
        priceRange {
          minVariantPrice { amount currencyCode }
        }
      }
    }
  }
}`;

const data = await postGraphQL(API_URL, QUERY, STOREFRONT_TOKEN);
const nodes = data?.collection?.products?.nodes ?? [];

const feed = createFeed({ title: SHOP_NAME, link: COLLECTION_URL });

const items = nodes.map((node) => {
    const link = node.onlineStoreUrl ?? `${SITE_URL}/products/${node.handle}`;
    const { amount, currencyCode } = node.priceRange.minVariantPrice;
    const price = `${Number(amount).toLocaleString('ja-JP')}${currencyCode}`;
    const stock = node.availableForSale ? '在庫あり' : '売切れ';
    const description = [normalizeText(node.description), `${price} / ${stock}`]
        .filter(Boolean)
        .join(' — ');

    return {
        title: normalizeText(node.title),
        link,
        date: normalizeDate(node.publishedAt),
        description,
        image: node.featuredImage?.url || undefined,
    };
});

addFeedItems(feed, items);
await writeFeed(import.meta.url, 'ambiant.xml', feed);
