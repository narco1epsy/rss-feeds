export async function fetchText(url, headers = {}) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed request: ${res.status} ${res.statusText}`);
    }

    return await res.text();
}

export async function fetchJson(url, headers = {}) {
    const res = await fetch(url, {
        headers: {
            accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed request: ${res.status} ${res.statusText}`);
    }

    return await res.json();
}

export async function postForm(url, body, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (compatible; rss-feeds-bot/1.0; +GitHub Actions)',
            ...headers,
        },
        body: body instanceof URLSearchParams ? body : new URLSearchParams(body),
    });

    if (!res.ok) {
        throw new Error(`Failed request: ${res.status} ${res.statusText}`);
    }

    return await res.text();
}
