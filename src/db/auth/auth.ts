import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/validation";
import { createId } from "../ids";
import { getDatabase } from "../index";

export type User = { id: string; name: string; email: string };

export type AuthState = {
  /** The signed-in user, or null when signed out. */
  user: User | null;
  /** Whether an account has been created on this device. */
  hasAccount: boolean;
};

export async function getAuthState(): Promise<AuthState> {
  const db = await getDatabase();

  const user = await db.getFirstAsync<User>(
    `SELECT u.id, u.name, u.email
     FROM auth_session s
     JOIN users u ON u.id = s.user_id`,
  );
  const account = await db.getFirstAsync<{ id: string }>("SELECT id FROM users LIMIT 1");

  return { user: user ?? null, hasAccount: account !== null };
}

async function startSession(userId: string) {
  const db = await getDatabase();

  await db.runAsync(
    "INSERT OR REPLACE INTO auth_session (id, user_id, created_at) VALUES (1, ?, ?)",
    userId,
    new Date().toISOString(),
  );
}

/**
 * Creates the account for this device and signs it in. A device holds one
 * account, because the teaching data is not separated per user.
 */
export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const db = await getDatabase();
  const user: User = {
    id: createId(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
  };
  const { hash, salt, cost } = await hashPassword(input.password);
  const now = new Date().toISOString();

  // The existence check is part of the insert, so two submits cannot both succeed.
  const result = await db.runAsync(
    `INSERT INTO users (
       id, name, email, password_hash, password_salt, password_cost,
       created_at, updated_at
     )
     SELECT ?, ?, ?, ?, ?, ?, ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM users)`,
    user.id, user.name, user.email, hash, salt, cost, now, now,
  );

  if (result.changes === 0) {
    throw new Error("This device already has an account. Sign in instead.");
  }

  await startSession(user.id);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<
    User & { password_hash: string; password_salt: string; password_cost: number }
  >(
    `SELECT id, name, email, password_hash, password_salt, password_cost
     FROM users WHERE email = ?`,
    normalizeEmail(email),
  );

  const valid =
    row !== null &&
    (await verifyPassword(password, {
      hash: row.password_hash,
      salt: row.password_salt,
      cost: row.password_cost,
    }));

  // One message for both cases, so it doesn't reveal which part was wrong.
  if (!row || !valid) {
    throw new Error("Incorrect email or password.");
  }

  await startSession(row.id);
  return { id: row.id, name: row.name, email: row.email };
}

export async function signOut(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM auth_session");
}
