import { StarwebSearchScraper } from '../bases/starweb.js';
export class AudioPerformanceScraper extends StarwebSearchScraper {
    constructor() {
        super({
            name: 'AudioPerformance',
            baseUrl: 'https://www.audioperformance.se',
            slug: 'audioperformance',
        });
    }
}
