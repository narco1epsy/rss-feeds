import * as cheerio from 'cheerio';

export function normalizeText(text = '') {
    return String(text).replace(/\s+/g, ' ').trim();
}

export function normalizeUrl(rawUrl, baseUrl) {
    if (!rawUrl) return '';
    try {
        const url = new URL(rawUrl, baseUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
        return url.href;
    } catch {
        return '';
    }
}

export function normalizeDate(value) {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
}

export function stripHtml(html = '') {
    const $ = cheerio.load(html || '');
    return normalizeText($.text());
}
