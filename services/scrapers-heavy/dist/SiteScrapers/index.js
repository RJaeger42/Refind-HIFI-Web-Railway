"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVAILABLE_SCRAPERS = exports.createRehifiPlaywright = exports.RehifiPlaywright = exports.createReferenceAudioPlaywright = exports.ReferenceAudioPlaywright = exports.createLasseshifiPlaywright = exports.LasseshifiPlaywright = exports.createLjudmakarnPlaywright = exports.LjudmakarnPlaywright = exports.createHifiTorgetPlaywright = exports.HifiTorgetPlaywright = exports.createHifiSharkPlaywright = exports.HifiSharkPlaywright = exports.createHifiPunktenPlaywright = exports.HifiPunktenPlaywright = exports.createHifiPulsPlaywright = exports.HifiPulsPlaywright = exports.createHifiExperiencePlaywright = exports.HifiExperiencePlaywright = exports.createFacebookPlaywright = exports.FacebookPlaywright = exports.createAudioPerformancePlaywright = exports.AudioPerformancePlaywright = exports.createAudioConceptPlaywright = exports.AudioConceptPlaywright = exports.createAkkelisAudioPlaywright = exports.AkkelisAudioPlaywright = exports.sleep = exports.deduplicateByUrl = exports.filterByQuery = exports.filterByPrice = exports.getDefaultUserAgent = exports.normalizeUrl = exports.extractPrice = exports.BaseScraper = void 0;
exports.getScraperByName = getScraperByName;
exports.getAvailableScrapers = getAvailableScrapers;
// Base class
var BaseScraper_1 = require("./BaseScraper");
Object.defineProperty(exports, "BaseScraper", { enumerable: true, get: function () { return BaseScraper_1.BaseScraper; } });
// Utility functions
var utils_1 = require("./utils");
Object.defineProperty(exports, "extractPrice", { enumerable: true, get: function () { return utils_1.extractPrice; } });
Object.defineProperty(exports, "normalizeUrl", { enumerable: true, get: function () { return utils_1.normalizeUrl; } });
Object.defineProperty(exports, "getDefaultUserAgent", { enumerable: true, get: function () { return utils_1.getDefaultUserAgent; } });
Object.defineProperty(exports, "filterByPrice", { enumerable: true, get: function () { return utils_1.filterByPrice; } });
Object.defineProperty(exports, "filterByQuery", { enumerable: true, get: function () { return utils_1.filterByQuery; } });
Object.defineProperty(exports, "deduplicateByUrl", { enumerable: true, get: function () { return utils_1.deduplicateByUrl; } });
Object.defineProperty(exports, "sleep", { enumerable: true, get: function () { return utils_1.sleep; } });
// Scraper implementations
var AkkelisAudio_1 = require("./scrapers/AkkelisAudio");
Object.defineProperty(exports, "AkkelisAudioPlaywright", { enumerable: true, get: function () { return AkkelisAudio_1.AkkelisAudioPlaywright; } });
Object.defineProperty(exports, "createAkkelisAudioPlaywright", { enumerable: true, get: function () { return AkkelisAudio_1.createAkkelisAudioPlaywright; } });
var AudioConcept_1 = require("./scrapers/AudioConcept");
Object.defineProperty(exports, "AudioConceptPlaywright", { enumerable: true, get: function () { return AudioConcept_1.AudioConceptPlaywright; } });
Object.defineProperty(exports, "createAudioConceptPlaywright", { enumerable: true, get: function () { return AudioConcept_1.createAudioConceptPlaywright; } });
var AudioPerformance_1 = require("./scrapers/AudioPerformance");
Object.defineProperty(exports, "AudioPerformancePlaywright", { enumerable: true, get: function () { return AudioPerformance_1.AudioPerformancePlaywright; } });
Object.defineProperty(exports, "createAudioPerformancePlaywright", { enumerable: true, get: function () { return AudioPerformance_1.createAudioPerformancePlaywright; } });
var Facebook_1 = require("./scrapers/Facebook");
Object.defineProperty(exports, "FacebookPlaywright", { enumerable: true, get: function () { return Facebook_1.FacebookPlaywright; } });
Object.defineProperty(exports, "createFacebookPlaywright", { enumerable: true, get: function () { return Facebook_1.createFacebookPlaywright; } });
var HifiExperience_1 = require("./scrapers/HifiExperience");
Object.defineProperty(exports, "HifiExperiencePlaywright", { enumerable: true, get: function () { return HifiExperience_1.HifiExperiencePlaywright; } });
Object.defineProperty(exports, "createHifiExperiencePlaywright", { enumerable: true, get: function () { return HifiExperience_1.createHifiExperiencePlaywright; } });
var HifiPuls_1 = require("./scrapers/HifiPuls");
Object.defineProperty(exports, "HifiPulsPlaywright", { enumerable: true, get: function () { return HifiPuls_1.HifiPulsPlaywright; } });
Object.defineProperty(exports, "createHifiPulsPlaywright", { enumerable: true, get: function () { return HifiPuls_1.createHifiPulsPlaywright; } });
var HifiPunkten_1 = require("./scrapers/HifiPunkten");
Object.defineProperty(exports, "HifiPunktenPlaywright", { enumerable: true, get: function () { return HifiPunkten_1.HifiPunktenPlaywright; } });
Object.defineProperty(exports, "createHifiPunktenPlaywright", { enumerable: true, get: function () { return HifiPunkten_1.createHifiPunktenPlaywright; } });
var HifiShark_1 = require("./scrapers/HifiShark");
Object.defineProperty(exports, "HifiSharkPlaywright", { enumerable: true, get: function () { return HifiShark_1.HifiSharkPlaywright; } });
Object.defineProperty(exports, "createHifiSharkPlaywright", { enumerable: true, get: function () { return HifiShark_1.createHifiSharkPlaywright; } });
var HifiTorget_1 = require("./scrapers/HifiTorget");
Object.defineProperty(exports, "HifiTorgetPlaywright", { enumerable: true, get: function () { return HifiTorget_1.HifiTorgetPlaywright; } });
Object.defineProperty(exports, "createHifiTorgetPlaywright", { enumerable: true, get: function () { return HifiTorget_1.createHifiTorgetPlaywright; } });
var Ljudmakarn_1 = require("./scrapers/Ljudmakarn");
Object.defineProperty(exports, "LjudmakarnPlaywright", { enumerable: true, get: function () { return Ljudmakarn_1.LjudmakarnPlaywright; } });
Object.defineProperty(exports, "createLjudmakarnPlaywright", { enumerable: true, get: function () { return Ljudmakarn_1.createLjudmakarnPlaywright; } });
var Lasseshifi_1 = require("./scrapers/Lasseshifi");
Object.defineProperty(exports, "LasseshifiPlaywright", { enumerable: true, get: function () { return Lasseshifi_1.LasseshifiPlaywright; } });
Object.defineProperty(exports, "createLasseshifiPlaywright", { enumerable: true, get: function () { return Lasseshifi_1.createLasseshifiPlaywright; } });
var ReferenceAudio_1 = require("./scrapers/ReferenceAudio");
Object.defineProperty(exports, "ReferenceAudioPlaywright", { enumerable: true, get: function () { return ReferenceAudio_1.ReferenceAudioPlaywright; } });
Object.defineProperty(exports, "createReferenceAudioPlaywright", { enumerable: true, get: function () { return ReferenceAudio_1.createReferenceAudioPlaywright; } });
var Rehifi_1 = require("./scrapers/Rehifi");
Object.defineProperty(exports, "RehifiPlaywright", { enumerable: true, get: function () { return Rehifi_1.RehifiPlaywright; } });
Object.defineProperty(exports, "createRehifiPlaywright", { enumerable: true, get: function () { return Rehifi_1.createRehifiPlaywright; } });
/**
 * Pre-configured scraper registry
 * Useful for dynamic scraper selection
 */
exports.AVAILABLE_SCRAPERS = {
    akkelisaudio: () => Promise.resolve().then(() => __importStar(require('./scrapers/AkkelisAudio'))).then((m) => m.createAkkelisAudioPlaywright()),
    audioconcept: () => Promise.resolve().then(() => __importStar(require('./scrapers/AudioConcept'))).then((m) => m.createAudioConceptPlaywright()),
    audioperformance: () => Promise.resolve().then(() => __importStar(require('./scrapers/AudioPerformance'))).then((m) => m.createAudioPerformancePlaywright()),
    facebook: () => Promise.resolve().then(() => __importStar(require('./scrapers/Facebook'))).then((m) => m.createFacebookPlaywright()),
    hifiexperience: () => Promise.resolve().then(() => __importStar(require('./scrapers/HifiExperience'))).then((m) => m.createHifiExperiencePlaywright()),
    hifipuls: () => Promise.resolve().then(() => __importStar(require('./scrapers/HifiPuls'))).then((m) => m.createHifiPulsPlaywright()),
    hifipunkten: () => Promise.resolve().then(() => __importStar(require('./scrapers/HifiPunkten'))).then((m) => m.createHifiPunktenPlaywright()),
    hifishark: () => Promise.resolve().then(() => __importStar(require('./scrapers/HifiShark'))).then((m) => m.createHifiSharkPlaywright()),
    hifitorget: () => Promise.resolve().then(() => __importStar(require('./scrapers/HifiTorget'))).then((m) => m.createHifiTorgetPlaywright()),
    ljudmakarn: () => Promise.resolve().then(() => __importStar(require('./scrapers/Ljudmakarn'))).then((m) => m.createLjudmakarnPlaywright()),
    lasseshifi: () => Promise.resolve().then(() => __importStar(require('./scrapers/Lasseshifi'))).then((m) => m.createLasseshifiPlaywright()),
    referenceaudio: () => Promise.resolve().then(() => __importStar(require('./scrapers/ReferenceAudio'))).then((m) => m.createReferenceAudioPlaywright()),
    rehifi: () => Promise.resolve().then(() => __importStar(require('./scrapers/Rehifi'))).then((m) => m.createRehifiPlaywright()),
};
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
async function getScraperByName(name) {
    return exports.AVAILABLE_SCRAPERS[name]();
}
/**
 * Get all available scraper names
 */
function getAvailableScrapers() {
    return Object.keys(exports.AVAILABLE_SCRAPERS);
}
