import { BlocketScraper } from './blocket.js';
import { TraderaScraper } from './tradera.js';
import { FacebookScraper } from './facebook.js';
import { HifiTorgetScraper } from './hifitorget.js';
import { HiFiSharkScraper } from './hifishark.js';
import { ReferenceAudioScraper } from './referenceaudio.js';
import { LjudmakarnScraper } from './ljudmakarn.js';
import { HiFiPunktenScraper } from './hifipunkten.js';
import { RehifiScraper } from './rehifi.js';
import { AudioPerformanceScraper } from './audioperformance.js';
import { HifiExperienceScraper } from './hifiexperience.js';
import { AudioConceptScraper } from './audioconcept.js';
import { LassesHiFiScraper } from './lasseshifi.js';
import { AkkelisAudioScraper } from './akkelisaudio.js';
import { HifiPulsScraper } from './hifipuls.js';
export const siteScrapers = [
    new BlocketScraper(),
    new TraderaScraper(),
    new FacebookScraper(),
    new HifiTorgetScraper(),
    new HiFiSharkScraper(),
    new ReferenceAudioScraper(),
    new LjudmakarnScraper(),
    new HiFiPunktenScraper(),
    new RehifiScraper(),
    new AudioPerformanceScraper(),
    new HifiExperienceScraper(),
    new AudioConceptScraper(),
    new LassesHiFiScraper(),
    new AkkelisAudioScraper(),
    new HifiPulsScraper(),
];
