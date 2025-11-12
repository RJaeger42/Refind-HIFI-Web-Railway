/**
 * SiteScrapers - TypeScript Playwright-based Web Scraper Library
 *
 * Central export file for all scraper modules and utilities.
 * Implements consistent SiteScraper interface across all implementations.
 *
 * Usage:
 *   import { AkkelisAudioPlaywright, HifiPulsPlaywright } from './SiteScrapers';
 *
 * or with factory functions:
 *   import { createAkkelisAudioPlaywright } from './SiteScrapers';
 */
export { SiteScraper, ListingResult, ScraperOptions } from './types';
import type { SiteScraper } from './types';
export { BaseScraper } from './BaseScraper';
export { extractPrice, normalizeUrl, getDefaultUserAgent, filterByPrice, filterByQuery, deduplicateByUrl, sleep, } from './utils';
export { AkkelisAudioPlaywright, createAkkelisAudioPlaywright } from './scrapers/AkkelisAudio';
export { AudioConceptPlaywright, createAudioConceptPlaywright } from './scrapers/AudioConcept';
export { AudioPerformancePlaywright, createAudioPerformancePlaywright } from './scrapers/AudioPerformance';
export { BlocketPlaywright, createBlocketPlaywright } from './scrapers/Blocket';
export { FacebookPlaywright, createFacebookPlaywright } from './scrapers/Facebook';
export { HifiExperiencePlaywright, createHifiExperiencePlaywright } from './scrapers/HifiExperience';
export { HifiPulsPlaywright, createHifiPulsPlaywright } from './scrapers/HifiPuls';
export { HifiPunktenPlaywright, createHifiPunktenPlaywright } from './scrapers/HifiPunkten';
export { HifiSharkPlaywright, createHifiSharkPlaywright } from './scrapers/HifiShark';
export { HifiTorgetPlaywright, createHifiTorgetPlaywright } from './scrapers/HifiTorget';
export { LjudmakarnPlaywright, createLjudmakarnPlaywright } from './scrapers/Ljudmakarn';
export { LasseshifiPlaywright, createLasseshifiPlaywright } from './scrapers/Lasseshifi';
export { ReferenceAudioPlaywright, createReferenceAudioPlaywright } from './scrapers/ReferenceAudio';
export { RehifiPlaywright, createRehifiPlaywright } from './scrapers/Rehifi';
export { TraderaPlaywright, createTraderaPlaywright } from './scrapers/Tradera';
/**
 * Pre-configured scraper registry
 * Useful for dynamic scraper selection
 */
export declare const AVAILABLE_SCRAPERS: {
    readonly akkelisaudio: () => Promise<import("./scrapers/AkkelisAudio").AkkelisAudioPlaywright>;
    readonly audioconcept: () => Promise<import("./scrapers/AudioConcept").AudioConceptPlaywright>;
    readonly audioperformance: () => Promise<import("./scrapers/AudioPerformance").AudioPerformancePlaywright>;
    readonly blocket: () => Promise<import("./scrapers/Blocket").BlocketPlaywright>;
    readonly facebook: () => Promise<import("./scrapers/Facebook").FacebookPlaywright>;
    readonly hifiexperience: () => Promise<import("./scrapers/HifiExperience").HifiExperiencePlaywright>;
    readonly hifipuls: () => Promise<import("./scrapers/HifiPuls").HifiPulsPlaywright>;
    readonly hifipunkten: () => Promise<import("./scrapers/HifiPunkten").HifiPunktenPlaywright>;
    readonly hifishark: () => Promise<import("./scrapers/HifiShark").HifiSharkPlaywright>;
    readonly hifitorget: () => Promise<import("./scrapers/HifiTorget").HifiTorgetPlaywright>;
    readonly ljudmakarn: () => Promise<import("./scrapers/Ljudmakarn").LjudmakarnPlaywright>;
    readonly lasseshifi: () => Promise<import("./scrapers/Lasseshifi").LasseshifiPlaywright>;
    readonly referenceaudio: () => Promise<import("./scrapers/ReferenceAudio").ReferenceAudioPlaywright>;
    readonly rehifi: () => Promise<import("./scrapers/Rehifi").RehifiPlaywright>;
    readonly tradera: () => Promise<import("./scrapers/Tradera").TraderaPlaywright>;
};
export type ScraperName = keyof typeof AVAILABLE_SCRAPERS;
/**
 * Get a scraper by name
 *
 * @param name - Name of the scraper
 * @returns Promise resolving to scraper instance
 *
 * @example
 * ```typescript
 * const scraper = await getScraperByName('akkelisaudio');
 * const results = await scraper.search('amplifier');
 * ```
 */
export declare function getScraperByName(name: ScraperName): Promise<SiteScraper>;
/**
 * Get all available scraper names
 */
export declare function getAvailableScrapers(): ScraperName[];
//# sourceMappingURL=index.d.ts.map