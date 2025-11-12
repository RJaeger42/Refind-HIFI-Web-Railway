import { BaseSiteScraper } from '../base.js';
export class BlocketScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'Blocket',
            baseUrl: 'https://www.blocket.se',
            slug: 'blocket',
        });
    }
    async search(page, params) {
        const query = (params.query ?? '').trim();
        if (!query) {
            return [];
        }
        const searchUrl = this.buildSearchUrl(query, params);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForSelector('article', { timeout: 20000 });
        await this.loadFullResultList(page);
        const rawListings = await this.collectListings(page);
        const minPrice = params.minPrice ?? null;
        const maxPrice = params.maxPrice ?? null;
        const tokens = this.tokenizeQuery(query);
        const seen = new Set();
        const results = [];
        for (const listing of rawListings) {
            if (!listing.url || !listing.title) {
                continue;
            }
            const priceValue = listing.priceText ? this.extractPrice(listing.priceText) : null;
            if (minPrice && priceValue && priceValue < minPrice) {
                continue;
            }
            if (maxPrice && priceValue && priceValue > maxPrice) {
                continue;
            }
            if (!this.matchesTokens(listing.title, tokens)) {
                continue;
            }
            if (seen.has(listing.url)) {
                continue;
            }
            seen.add(listing.url);
            results.push({
                title: listing.title,
                description: listing.description || undefined,
                price: priceValue ?? undefined,
                url: listing.url,
                imageUrl: listing.image ?? undefined,
                postedDate: listing.timestamp ?? undefined,
                location: listing.location ?? undefined,
                rawData: {
                    source: 'blocket',
                    priceText: listing.priceText,
                },
            });
        }
        return results;
    }
    buildSearchUrl(query, params) {
        const url = new URL(`${this.baseUrl}/annonser/hela_sverige`);
        url.searchParams.set('q', query);
        if (params.minPrice) {
            url.searchParams.set('price_min', String(Math.floor(params.minPrice)));
        }
        if (params.maxPrice) {
            url.searchParams.set('price_max', String(Math.floor(params.maxPrice)));
        }
        return url.toString();
    }
    tokenizeQuery(query) {
        return query
            .toLowerCase()
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean);
    }
    matchesTokens(text, tokens) {
        if (!tokens.length) {
            return true;
        }
        const haystack = text.toLowerCase();
        return tokens.every((token) => haystack.includes(token));
    }
    async loadFullResultList(page) {
        let stableIterations = 0;
        let lastCount = 0;
        for (let i = 0; i < 30 && stableIterations < 4; i += 1) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight * 2);
            });
            await page.waitForTimeout(1200);
            await page.waitForLoadState('networkidle').catch(() => undefined);
            const loadMoreButton = page.locator('button:has-text("Visa fler")');
            if (await loadMoreButton.count()) {
                try {
                    await loadMoreButton.first().click({ timeout: 2000 });
                    await page.waitForTimeout(1000);
                }
                catch {
                    // Ignore failures - scrolling fallback will still work
                }
            }
            const currentCount = await page.evaluate(() => document.querySelectorAll('article a[href*="/annons/"]').length);
            if (currentCount <= lastCount) {
                stableIterations += 1;
            }
            else {
                stableIterations = 0;
                lastCount = currentCount;
            }
        }
    }
    async collectListings(page) {
        const listings = await page.evaluate(() => {
            const seen = new Set();
            const makeAbsolute = (href) => {
                if (!href) {
                    return null;
                }
                try {
                    return new URL(href, window.location.origin).toString();
                }
                catch {
                    return href;
                }
            };
            const cards = Array.from(document.querySelectorAll('article'));
            const items = [];
            for (const card of cards) {
                const anchor = card.querySelector('a[href*="/annons/"]');
                if (!anchor) {
                    continue;
                }
                const normalizedUrl = makeAbsolute(anchor.getAttribute('href'));
                if (!normalizedUrl || seen.has(normalizedUrl)) {
                    continue;
                }
                seen.add(normalizedUrl);
                const titleText = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || null;
                const priceNode = card.querySelector('[class*="Price__StyledPrice"]');
                let priceText = priceNode?.textContent?.trim() || null;
                if (!priceText) {
                    const textNodes = Array.from(card.querySelectorAll('div,span'))
                        .map((node) => node.textContent?.trim() || '')
                        .filter(Boolean);
                    priceText = textNodes.find((text) => /kr/.test(text)) || null;
                }
                const locationWrapper = card.querySelector('[class*="TopInfoWrapper"]');
                let locationText = null;
                if (locationWrapper) {
                    const links = Array.from(locationWrapper.querySelectorAll('a'));
                    if (links.length) {
                        locationText = links[links.length - 1].textContent?.trim() || null;
                    }
                    else {
                        locationText = locationWrapper.textContent?.trim() || null;
                    }
                }
                const timeNode = card.querySelector('[class*="Time"]');
                const timestamp = timeNode?.textContent?.trim() || null;
                const imageNode = card.querySelector('img');
                const image = imageNode?.getAttribute('src') ||
                    imageNode?.getAttribute('data-src') ||
                    (imageNode?.getAttribute('srcset') || imageNode?.getAttribute('data-srcset'))?.split(' ')[0] ||
                    null;
                const descriptionNode = card.querySelector('[class*="SubjectContainer"]');
                const description = descriptionNode?.textContent?.trim() || null;
                items.push({
                    title: titleText,
                    url: normalizedUrl,
                    priceText,
                    location: locationText,
                    timestamp,
                    image,
                    description,
                });
            }
            return items;
        });
        return listings;
    }
}
