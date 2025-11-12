import { AshopCategoryScraper } from '../bases/ashop.js';
export class LjudmakarnScraper extends AshopCategoryScraper {
    constructor() {
        super({
            name: 'Ljudmakarn',
            baseUrl: 'https://www.ljudmakarn.se',
            categoryUrl: 'https://www.ljudmakarn.se/kategori/107/fyndhornan',
            slug: 'ljudmakarn',
        });
    }
}
