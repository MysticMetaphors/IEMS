import { hashPassword, verifyPassword } from '@/lib/auth/password';

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: async (length: number) =>
    new Uint8Array(require('crypto').randomBytes(length)),
}));

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse');

    await expect(verifyPassword('correct horse', stored)).resolves.toBe(true);
    await expect(verifyPassword('Correct horse', stored)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    const first = await hashPassword('correct horse');
    const second = await hashPassword('correct horse');

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });
});
