import { AshopCategoryScraper } from '../bases/ashop.js';

export class ReferenceAudioScraper extends AshopCategoryScraper {
  constructor() {
    super({
      name: 'Reference Audio',
      baseUrl: 'https://www.referenceaudio.se',
      categoryUrl: 'https://www.referenceaudio.se/kategori/935/begagnat',
      slug: 'reference-audio',
    });
  }
}
