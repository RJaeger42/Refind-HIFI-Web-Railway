import { load } from 'cheerio';
const slugify = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'scraper';
export class BaseSiteScraper {
    name;
    baseUrl;
    slug;
    lastFetch = 0;
    minRequestIntervalMs;
    headers;
    constructor(options) {
        this.name = options.name;
        this.baseUrl = options.baseUrl;
        this.slug = options.slug ?? slugify(options.name);
        this.minRequestIntervalMs = options.minRequestIntervalMs ?? 1500;
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            ...options.headers,
        };
    }
    async fetchDocument(page, url, waitMs = 0) {
        await this.rateLimit();
        await page.setExtraHTTPHeaders(this.headers);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
        if (waitMs > 0) {
            await page.waitForTimeout(waitMs);
        }
        const html = await page.content();
        return load(html);
    }
    async fetchJson(page, url, params) {
        await this.rateLimit();
        const contextRequest = page.context().request;
        const normalizedParams = params &&
            Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value === undefined || value === null ? '' : String(value)]));
        const response = await contextRequest.get(url, {
            params: normalizedParams,
            headers: this.headers,
            timeout: 45000,
        });
        if (!response.ok()) {
            throw new Error(`${this.name}: ${response.status()} ${response.statusText()}`);
        }
        return (await response.json());
    }
    async rateLimit() {
        const now = Date.now();
        const delta = now - this.lastFetch;
        if (delta < this.minRequestIntervalMs) {
            await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - delta));
        }
        this.lastFetch = Date.now();
    }
    normalizeUrl(url) {
        if (!url) {
            return this.baseUrl;
        }
        if (url.startsWith('http')) {
            return url;
        }
        if (url.startsWith('/')) {
            return `${this.baseUrl}${url}`;
        }
        return `${this.baseUrl}/${url}`;
    }
    extractPrice(text) {
        if (!text) {
            return null;
        }
        const cleaned = text
            .toString()
            .replace(/\s/g, '')
            .replace(/[^\d,.-]/g, '');
        if (!cleaned) {
            return null;
        }
        const hasComma = cleaned.includes(',');
        const hasDot = cleaned.includes('.');
        let normalized = cleaned;
        if (hasComma && hasDot) {
            normalized =
                cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
        }
        else if (hasComma) {
            const parts = cleaned.split(',');
            normalized = parts.length === 2 && parts[1].length === 2 ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '');
        }
        const value = Number(normalized);
        return Number.isFinite(value) ? value : null;
    }
}
