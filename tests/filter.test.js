import { describe, it, expect } from 'vitest';
import { matches, PRICE_BANDS } from '../src/views/home.js';

function bean(overrides = {}) {
  return {
    name: 'Test Bean',
    roaster: 'Test Roaster',
    averageRating: 3.5,
    valuePer100g: { value: 6, currency: { code: 'EUR', symbol: '€' } },
    facts: { roastType: 'Filter', blend: 'Blend', decaf: false, organic: false, origins: ['Ethiopia'] },
    flavours: ['Berry'],
    ...overrides,
  };
}

const noFilters = { q: '', roaster: '', roastType: '', blend: '', decaf: false, organic: false, minRating: 0, priceBand: '' };

describe('home filters', () => {
  it('matches everything with no filters', () => {
    expect(matches(bean(), noFilters)).toBe(true);
  });

  it('search matches name, roaster, origin and flavours', () => {
    expect(matches(bean(), { ...noFilters, q: 'ethiopia' })).toBe(true);
    expect(matches(bean(), { ...noFilters, q: 'berry' })).toBe(true);
    expect(matches(bean(), { ...noFilters, q: 'nope' })).toBe(false);
  });

  it('filters by rating, decaf and roaster', () => {
    expect(matches(bean({ averageRating: 2 }), { ...noFilters, minRating: 3 })).toBe(false);
    expect(matches(bean(), { ...noFilters, decaf: true })).toBe(false);
    expect(matches(bean(), { ...noFilters, roaster: 'Other' })).toBe(false);
  });

  it('filters by price-per-100g band', () => {
    expect(matches(bean({ valuePer100g: { value: 4 } }), { ...noFilters, priceBand: 'lt5' })).toBe(true);
    expect(matches(bean({ valuePer100g: { value: 6 } }), { ...noFilters, priceBand: 'lt5' })).toBe(false);
    expect(matches(bean({ valuePer100g: { value: 6 } }), { ...noFilters, priceBand: '5-7.5' })).toBe(true);
    expect(matches(bean({ valuePer100g: { value: 12 } }), { ...noFilters, priceBand: 'gt10' })).toBe(true);
  });

  it('excludes beans without a price when a price band is selected', () => {
    expect(matches(bean({ valuePer100g: null }), { ...noFilters, priceBand: 'lt5' })).toBe(false);
    expect(matches(bean({ valuePer100g: null }), noFilters)).toBe(true);
  });

  it('has band boundaries that do not overlap', () => {
    // A value of exactly 5 belongs to the 5-7.5 band, not "under €5".
    const b5 = bean({ valuePer100g: { value: 5 } });
    const hits = PRICE_BANDS.filter((band) => matches(b5, { ...noFilters, priceBand: band.id }));
    expect(hits.map((h) => h.id)).toEqual(['5-7.5']);
  });
});
