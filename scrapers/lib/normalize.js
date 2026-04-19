import * as cheerio from 'cheerio';

export function normalizeText(text = '') {
    return String(text).replace(/\s+/g, ' ').trim();
}

export function normalizeUrl(rawUrl, baseUrl) {
    if (!rawUrl) return '';
    return new URL(rawUrl, baseUrl).href;
}

export function normalizeDate(value) {
    return value ? new Date(value) : new Date();
}

export function stripHtml(html = '') {
    const $ = cheerio.load(html || '');
    return normalizeText($.text());
}

export function joinLines(lines = []) {
    return lines.filter(Boolean).join('\n\n');
}
