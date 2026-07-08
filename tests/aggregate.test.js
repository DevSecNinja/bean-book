import { describe, it, expect } from 'vitest';
import { normalize, slugify, aggregate } from '../scripts/lib/aggregate.js';

function review(overrides = {}) {
  return {
    id: 1,
    submittedAt: '2026-01-01T00:00:00Z',
    author: { login: 'a', avatarUrl: null, profileUrl: null },
    name: 'Guji Highlands',
    roaster: 'Simon Lévelt',
    roastType: 'Filter',
    roastLevel: 'Light',
    blend: 'Blend',
    rating: 3,
    decaf: false,
    organic: false,
    origins: ['Ethiopia'],
    process: null,
    species: 'Arabica',
    variety: null,
    currency: { code: 'EUR', symbol: '€' },
    cost: null,
    weightGrams: null,
    flavours: ['Berry'],
    brewMethod: null,
    website: null,
    notes: null,
    buyAgain: false,
    ...overrides,
  };
}

describe('normalize', () => {
  it('lowercases, trims, collapses whitespace and strips diacritics', () => {
    expect(normalize('  Simon   Lévelt ')).toBe('simon levelt');
    expect(normalize('CAFÉ')).toBe('cafe');
  });
});

describe('slugify', () => {
  it('creates url-safe slugs', () => {
    expect(slugify('Simon Lévelt', 'Guji Highlands')).toBe('simon-levelt-guji-highlands');
  });
});

describe('aggregate', () => {
  it('groups reviews of the same bean despite casing/diacritics', () => {
    const beans = aggregate([
      review({ id: 1, roaster: 'Simon Lévelt', name: 'Guji Highlands', rating: 4 }),
      review({ id: 2, roaster: 'simon levelt', name: 'guji  highlands', rating: 2 }),
    ]);
    expect(beans).toHaveLength(1);
    expect(beans[0].reviewCount).toBe(2);
    expect(beans[0].averageRating).toBe(3);
  });

  it('keeps distinct beans separate and sorts by rating', () => {
    const beans = aggregate([
      review({ id: 1, roaster: 'A', name: 'Low', rating: 2 }),
      review({ id: 2, roaster: 'B', name: 'High', rating: 5 }),
    ]);
    expect(beans).toHaveLength(2);
    expect(beans[0].name).toBe('High');
  });

  it('gives every bean a unique slug', () => {
    const beans = aggregate([
      review({ id: 1, roaster: 'A B', name: 'C', rating: 3 }),
      review({ id: 2, roaster: 'A', name: 'B C', rating: 4 }),
    ]);
    const slugs = beans.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('merges facts taking the most recent non-empty value', () => {
    const beans = aggregate([
      review({ id: 2, submittedAt: '2026-02-01T00:00:00Z', process: 'Washed', variety: null }),
      review({ id: 1, submittedAt: '2026-01-01T00:00:00Z', process: 'Natural', variety: 'Bourbon' }),
    ]);
    expect(beans[0].facts.process).toBe('Washed'); // newest wins
    expect(beans[0].facts.variety).toBe('Bourbon'); // newest was null -> fall back
  });

  it('unions flavours across reviews', () => {
    const beans = aggregate([
      review({ id: 1, flavours: ['Berry'] }),
      review({ id: 2, flavours: ['Berry', 'Citrus'] }),
    ]);
    expect(beans[0].flavours.sort()).toEqual(['Berry', 'Citrus']);
  });

  it('does not put purchase data (cost/weight/currency) in bean facts', () => {
    const beans = aggregate([review({ id: 1, cost: 12, weightGrams: 250 })]);
    expect(beans[0].facts).not.toHaveProperty('cost');
    expect(beans[0].facts).not.toHaveProperty('weightGrams');
    expect(beans[0].facts).not.toHaveProperty('currency');
  });

  it('computes the cheapest value per 100g across reviews', () => {
    const eur = { code: 'EUR', symbol: '€' };
    const beans = aggregate([
      review({ id: 1, cost: 12, weightGrams: 250, currency: eur }), // 4.80 / 100g
      review({ id: 2, cost: 10, weightGrams: 250, currency: eur }), // 4.00 / 100g
    ]);
    expect(beans[0].valuePer100g).toEqual({ value: 4, currency: eur });
  });

  it('has a null value per 100g when no review has cost + weight', () => {
    const beans = aggregate([review({ id: 1, cost: null, weightGrams: null })]);
    expect(beans[0].valuePer100g).toBeNull();
  });
});
