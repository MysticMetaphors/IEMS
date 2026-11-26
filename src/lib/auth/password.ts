import { scryptAsync } from "@noble/hashes/scrypt";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import * as Crypto from "expo-crypto";

// scrypt N = 2^cost. This runs in JavaScript on the phone, so the cost is kept
// low enough for sign-in to stay responsive. Each account stores the cost it was
// hashed with, so this can be raised without locking anyone out.
export const PASSWORD_COST = 12;

export type PasswordHash = { hash: string; salt: string; cost: number };

async function derive(password: string, salt: Uint8Array, cost: number) {
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 2 ** cost,
    r: 8,
    p: 1,
    dkLen: 32,
  });

  return bytesToHex(key);
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = await Crypto.getRandomBytesAsync(16);

  return {
    hash: await derive(password, salt, PASSWORD_COST),
    salt: bytesToHex(salt),
    cost: PASSWORD_COST,
  };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const hash = await derive(password, hexToBytes(stored.salt), stored.cost);

  let difference = hash.length ^ stored.hash.length;
  for (let i = 0; i < hash.length; i++) {
    difference |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  }

  return difference === 0;
}
