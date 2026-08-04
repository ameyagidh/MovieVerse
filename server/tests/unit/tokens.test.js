import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/tokens.js';

const fakeUser = { _id: { toString: () => 'user123' }, role: 'user', refreshTokenVersion: 4 };

describe('token utils', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user123');
  });

  it('carries the refresh token version', () => {
    const token = signRefreshToken(fakeUser);
    expect(verifyRefreshToken(token).v).toBe(4);
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken(fakeUser);
    expect(() => verifyAccessToken(token.slice(0, -2) + 'xx')).toThrow();
  });
});
