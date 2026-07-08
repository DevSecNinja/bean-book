import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/router.js';

describe('parseRoute', () => {
  it('routes / to home', () => {
    expect(parseRoute({ pathname: '/' })).toEqual({ name: 'home' });
  });

  it('routes /bean/:slug/ to the bean', () => {
    expect(parseRoute({ pathname: '/bean/simon-levelt-guji-highlands/' }))
      .toEqual({ name: 'bean', slug: 'simon-levelt-guji-highlands' });
  });

  it('handles a bean path without a trailing slash', () => {
    expect(parseRoute({ pathname: '/bean/wakuli-blend' }))
      .toEqual({ name: 'bean', slug: 'wakuli-blend' });
  });

  it('decodes the slug', () => {
    expect(parseRoute({ pathname: '/bean/a%20b/' }).slug).toBe('a b');
  });

  it('falls back to home for unknown paths', () => {
    expect(parseRoute({ pathname: '/about/' })).toEqual({ name: 'home' });
  });
});
