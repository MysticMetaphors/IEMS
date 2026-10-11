import * as Crypto from 'expo-crypto';
import { getDatabase } from './index';

export function createId(): string {
  return Crypto.randomUUID();
}

export async function createSequentialId( table: 'students' | 'classes' | 'class_enrollments' ): Promise<string> {
  const db = await getDatabase();
  const year = new Date().getFullYear().toString();

  const result = await db.getFirstAsync<{ custom_id: string }>(
    `SELECT custom_id 
     FROM ${table}
     WHERE custom_id LIKE ?
     ORDER BY custom_id DESC
     LIMIT 1`,
    `${year}%`,
  );

  const lastNumber = result ? Number(result.custom_id.slice(4)) : 0;

  return `${year}${String(lastNumber + 1).padStart(3, '0')}`;
}
