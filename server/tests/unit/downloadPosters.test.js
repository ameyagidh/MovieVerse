import { jest } from '@jest/globals';

describe('downloadPosters', () => {
  it('returns null for a movie with no imageUrl, without making any request', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn();

    const { downloadPosters } = await import('../../src/seed/downloadPosters.js');
    const results = await downloadPosters([{ wikidataId: 'Q999', imageUrl: null }]);

    expect(results.get('Q999')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();

    global.fetch = originalFetch;
  });
});
