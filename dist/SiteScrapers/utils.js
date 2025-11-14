"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPrice = extractPrice;
exports.normalizeUrl = normalizeUrl;
exports.getDefaultUserAgent = getDefaultUserAgent;
exports.filterByPrice = filterByPrice;
exports.deduplicateByUrl = deduplicateByUrl;
exports.filterByQuery = filterByQuery;
exports.sleep = sleep;
exports.matchesSearchQuery = matchesSearchQuery;
/**
 * Extract price from text string, handling various formats
 * Supports both comma and dot as decimal separators (Swedish format)
 */
function extractPrice(text) {
    if (!text) {
        return undefined;
    }
    // Remove currency symbols and spaces, keep numbers and commas/dots
    let cleaned = text.replace(/[^\d,.]/g, '').replace(/\s/g, '');
    // Handle multiple separators (Swedish format: 1.234,56)
    if (cleaned.includes(',') && cleaned.includes('.')) {
        const lastCommaIndex = cleaned.lastIndexOf(',');
        const lastDotIndex = cleaned.lastIndexOf('.');
        if (lastCommaIndex > lastDotIndex) {
            // Comma is decimal separator (1.234,56 -> 1234.56)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        else {
            // Dot is decimal separator (1,234.56)
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    else if (cleaned.includes(',')) {
        // Only comma - check if it's a decimal separator (2 digits after)
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length === 2) {
            cleaned = cleaned.replace(',', '.');
        }
        else {
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    try {
        const price = parseFloat(cleaned);
        return isNaN(price) ? undefined : price;
    }
    catch {
        return undefined;
    }
}
/**
 * Normalize URL to full URL if relative
 */
function normalizeUrl(url, baseUrl) {
    if (!url) {
        return '';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${url}`;
    }
    return `${baseUrl.replace(/\/$/, '')}/${url}`;
}
/**
 * Create a default user agent string
 */
function getDefaultUserAgent() {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}
/**
 * Filter listings by price range
 */
function filterByPrice(listings, minPrice, maxPrice) {
    return listings.filter((listing) => {
        if (minPrice && listing.price && listing.price < minPrice) {
            return false;
        }
        if (maxPrice && listing.price && listing.price > maxPrice) {
            return false;
        }
        return true;
    });
}
/**
 * Deduplicate listings by URL
 */
function deduplicateByUrl(listings) {
    const seen = new Set();
    return listings.filter((listing) => {
        if (seen.has(listing.url)) {
            return false;
        }
        seen.add(listing.url);
        return true;
    });
}
/**
 * Filter listings by query string using strict word boundary matching
 * @deprecated Use matchesSearchQuery() directly instead for better control
 */
function filterByQuery(listings, query) {
    if (!query || query.trim() === '') {
        return listings;
    }
    return listings.filter((listing) => {
        const textToSearch = `${listing.title} ${listing.description || ''}`;
        return matchesSearchQuery(textToSearch, query);
    });
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Check if text matches a search query with strict word boundary matching.
 * - Case-insensitive
 * - All search terms must be present as whole words
 * - Words can appear in any order
 * - Word boundaries prevent partial matches (e.g., "NAD" won't match "begagnad")
 *
 * @param text - The text to search in (title, description, etc.)
 * @param query - The search query (can be multiple words)
 * @returns true if all words in the query are found as whole words in the text
 *
 * @example
 * matchesSearchQuery("NAD M12 amplifier", "NAD M12") // true
 * matchesSearchQuery("M12 amplifier by NAD", "NAD M12") // true (any order)
 * matchesSearchQuery("begagnad amplifier", "NAD") // false (not a whole word)
 * matchesSearchQuery("NADC299", "NAD") // false (no word boundary)
 * matchesSearchQuery("NAD c299 amplifier", "NAD c299") // true
 */
function matchesSearchQuery(text, query) {
    if (!text || !query) {
        return false;
    }
    // Normalize text and query to lowercase for case-insensitive matching
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();
    // Split query into individual words
    const searchWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
    // Check that all search words are present as whole words in the text
    return searchWords.every(searchWord => {
        // Escape special regex characters in the search word
        const escapedWord = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Create a regex pattern that matches the word with word boundaries
        // \b matches word boundaries (spaces, punctuation, start/end of string)
        const wordBoundaryRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
        return wordBoundaryRegex.test(normalizedText);
    });
}
//# sourceMappingURL=utils.js.map