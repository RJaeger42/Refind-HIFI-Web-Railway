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

// Type definitions
export { SiteScraper, ListingResult, ScraperOptions } from './types';
import type { SiteScraper } from './types';

// Base class
export { BaseScraper } from './BaseScraper';

// Utility functions
export {
  extractPrice,
  normalizeUrl,
  getDefaultUserAgent,
  filterByPrice,
  filterByQuery,
  deduplicateByUrl,
  sleep,
} from './utils';

// Scraper implementations
export { AkkelisAudioPlaywright, createAkkelisAudioPlaywright } from './scrapers/AkkelisAudio';
export { AudioConceptPlaywright, createAudioConceptPlaywright } from './scrapers/AudioConcept';
export { AudioPerformancePlaywright, createAudioPerformancePlaywright } from './scrapers/AudioPerformance';
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

/**
 * Pre-configured scraper registry
 * Useful for dynamic scraper selection
 */
export const AVAILABLE_SCRAPERS = {
  akkelisaudio: () =>
    import('./scrapers/AkkelisAudio').then((m) =>
      m.createAkkelisAudioPlaywright()
    ),
  audioconcept: () =>
    import('./scrapers/AudioConcept').then((m) =>
      m.createAudioConceptPlaywright()
    ),
  audioperformance: () =>
    import('./scrapers/AudioPerformance').then((m) =>
      m.createAudioPerformancePlaywright()
    ),
  facebook: () =>
    import('./scrapers/Facebook').then((m) => m.createFacebookPlaywright()),
  hifiexperience: () =>
    import('./scrapers/HifiExperience').then((m) =>
      m.createHifiExperiencePlaywright()
    ),
  hifipuls: () =>
    import('./scrapers/HifiPuls').then((m) => m.createHifiPulsPlaywright()),
  hifipunkten: () =>
    import('./scrapers/HifiPunkten').then((m) =>
      m.createHifiPunktenPlaywright()
    ),
  hifishark: () =>
    import('./scrapers/HifiShark').then((m) =>
      m.createHifiSharkPlaywright()
    ),
  hifitorget: () =>
    import('./scrapers/HifiTorget').then((m) =>
      m.createHifiTorgetPlaywright()
    ),
  ljudmakarn: () =>
    import('./scrapers/Ljudmakarn').then((m) =>
      m.createLjudmakarnPlaywright()
    ),
  lasseshifi: () =>
    import('./scrapers/Lasseshifi').then((m) =>
      m.createLasseshifiPlaywright()
    ),
  referenceaudio: () =>
    import('./scrapers/ReferenceAudio').then((m) =>
      m.createReferenceAudioPlaywright()
    ),
  rehifi: () =>
    import('./scrapers/Rehifi').then((m) => m.createRehifiPlaywright()),
} as const;

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
export async function getScraperByName(
  name: ScraperName
): Promise<SiteScraper> {
  return AVAILABLE_SCRAPERS[name]() as Promise<SiteScraper>;
}

/**
 * Get all available scraper names
 */
export function getAvailableScrapers(): ScraperName[] {
  return Object.keys(AVAILABLE_SCRAPERS) as ScraperName[];
}
