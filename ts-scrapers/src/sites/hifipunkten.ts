import { AshopCategoryScraper } from '../bases/ashop.js';

export class HiFiPunktenScraper extends AshopCategoryScraper {
  constructor() {
    super({
      name: 'HiFi-Punkten',
      baseUrl: 'https://www.hifi-punkten.se',
      categoryUrl: 'https://www.hifi-punkten.se/kategori/1/produkter',
      slug: 'hifi-punkten',
    });
  }
}
