const RETRY_LIMIT = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
        if (attempt > 0) {
            await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s
        }
        try {
            const res = await fetch(url, options);
            if (RETRYABLE_STATUSES.has(res.status)) {
                lastError = new Error(`Failed request: ${res.status} ${res.statusText}`);
                continue;
            }
            if (!res.ok) {
                throw new Error(`Failed request: ${res.status} ${res.statusText}`);
            }
            return res;
        } catch (err) {
            if (err.message.startsWith('Failed request:')) throw err; // 4xx は即スロー
            lastError = err;
        }
    }
    throw lastError;
}

export async function fetchText(url, headers = {}) {
    const res = await fetchWithRetry(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
    });
    return await res.text();
}

export async function fetchJson(url, headers = {}) {
    const res = await fetchWithRetry(url, {
        headers: {
            accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
    });
    return await res.json();
}

export async function postForm(url, body, headers = {}) {
    const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
        body: body instanceof URLSearchParams ? body : new URLSearchParams(body),
    });
    return await res.text();
}

export async function postGraphQL(url, query, token) {
    const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': token,
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
        },
        body: JSON.stringify({ query }),
    });

    const json = await res.json();

    if (json.errors?.length) {
        throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`);
    }

    return json.data;
}
