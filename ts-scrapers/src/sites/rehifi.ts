import { StarwebSearchScraper } from '../bases/starweb.js';

export class RehifiScraper extends StarwebSearchScraper {
  constructor() {
    super({
      name: 'Rehifi',
      baseUrl: 'https://www.rehifi.se',
      slug: 'rehifi',
    });
  }
}
