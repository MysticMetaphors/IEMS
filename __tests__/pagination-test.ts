import { containsPattern, pageBounds } from '@/db/pagination';

describe('containsPattern', () => {
  it.each([undefined, '', '   '])('returns null for a blank search (%p)', (search) => {
    expect(containsPattern(search)).toBeNull();
  });

  it('trims the search and wraps it in wildcards', () => {
    expect(containsPattern('  Ana ')).toBe('%Ana%');
  });

  it('escapes LIKE special characters', () => {
    expect(containsPattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%');
  });
});

describe('pageBounds', () => {
  it('rounds down to whole numbers', () => {
    expect(pageBounds({ limit: 10.9, offset: 5.2 })).toEqual({ limit: 10, offset: 5 });
  });

  it('keeps limit at least 1 and offset at least 0', () => {
    expect(pageBounds({ limit: 0, offset: -3 })).toEqual({ limit: 1, offset: 0 });
  });
});
