#!/usr/bin/env npx ts-node

/**
 * Test script to verify strict word boundary matching
 */

import { matchesSearchQuery } from './SiteScrapers/utils';

interface TestCase {
  text: string;
  query: string;
  expected: boolean;
  description: string;
}

const testCases: TestCase[] = [
  // Basic NAD tests
  {
    text: 'NAD M12 amplifier',
    query: 'NAD',
    expected: true,
    description: 'NAD should match "NAD M12 amplifier"',
  },
  {
    text: 'begagnad amplifier',
    query: 'NAD',
    expected: false,
    description: 'NAD should NOT match "begagnad" (not a whole word)',
  },
  {
    text: 'NADC299 unit',
    query: 'NAD',
    expected: false,
    description: 'NAD should NOT match "NADC299" (no word boundary)',
  },

  // Multi-word tests
  {
    text: 'NAD M12 amplifier',
    query: 'NAD M12',
    expected: true,
    description: 'NAD M12 should match "NAD M12 amplifier"',
  },
  {
    text: 'M12 amplifier by NAD',
    query: 'NAD M12',
    expected: true,
    description: 'NAD M12 should match "M12 amplifier by NAD" (any order)',
  },
  {
    text: 'NAD c299 amplifier',
    query: 'NAD c299',
    expected: true,
    description: 'NAD c299 should match "NAD c299 amplifier"',
  },
  {
    text: 'c299 by NAD',
    query: 'NAD c299',
    expected: true,
    description: 'NAD c299 should match "c299 by NAD" (any order)',
  },

  // Case insensitivity tests
  {
    text: 'nad m12 amplifier',
    query: 'NAD M12',
    expected: true,
    description: 'Case insensitive: "nad m12" should match "NAD M12"',
  },
  {
    text: 'NAD M12 AMPLIFIER',
    query: 'nad m12',
    expected: true,
    description: 'Case insensitive: "NAD M12" should match "nad m12"',
  },

  // Edge cases
  {
    text: 'NAD',
    query: 'NAD',
    expected: true,
    description: 'Exact match should work',
  },
  {
    text: 'This is a NAD amplifier',
    query: 'NAD',
    expected: true,
    description: 'NAD in middle of sentence should match',
  },
  {
    text: 'NAD-M12',
    query: 'NAD',
    expected: true,
    description: 'NAD with hyphen should match (punctuation is word boundary)',
  },
  {
    text: 'Rotel amplifier',
    query: 'NAD',
    expected: false,
    description: 'NAD should not match "Rotel amplifier"',
  },
];

function runTests() {
  console.log('\n🧪 Testing strict word boundary matching\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, index) => {
    const result = matchesSearchQuery(test.text, test.query);
    const success = result === test.expected;

    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: PASS`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: FAIL`);
      console.log(`   Description: ${test.description}`);
      console.log(`   Text: "${test.text}"`);
      console.log(`   Query: "${test.query}"`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got: ${result}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${testCases.length} total)\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
