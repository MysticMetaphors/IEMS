import { detectIssues } from '@/db/classes/dashboard';

// expo-sqlite is native, so the database module is replaced in tests
jest.mock('@/db', () => ({ getDatabase: jest.fn() }));

const types = (
  status: 'scheduled' | 'completed' | 'cancelled',
  total_students: number,
  marked_students: number,
) => detectIssues({ status, total_students, marked_students }).map((issue) => issue.type);

describe('detectIssues', () => {
  it('flags a scheduled class with nobody marked as missed', () => {
    expect(types('scheduled', 3, 0)).toEqual(['missed']);
  });

  it('flags complete attendance with no status update', () => {
    expect(types('scheduled', 3, 3)).toEqual(['status_not_set']);
  });

  it('flags partial attendance on a scheduled class', () => {
    expect(types('scheduled', 3, 1)).toEqual(['attendance_incomplete']);
  });

  it('flags missing attendance on a completed class', () => {
    expect(types('completed', 3, 2)).toEqual(['attendance_missing']);
  });

  it('reports nothing for finished or cancelled classes', () => {
    expect(types('completed', 3, 3)).toEqual([]);
    expect(types('cancelled', 3, 0)).toEqual([]);
  });
});
