import { getDisplayStatus, isMissed } from '@/lib/utils/session-status';

const now = Date.parse('2026-01-15T12:00:00.000Z');
const past = '2026-01-15T11:00:00.000Z';
const future = '2026-01-15T13:00:00.000Z';

describe('session status', () => {
  it('shows a scheduled session that has ended as missed', () => {
    const session = { status: 'scheduled' as const, ends_at: past };

    expect(isMissed(session, now)).toBe(true);
    expect(getDisplayStatus(session, now)).toBe('missed');
  });

  it('keeps an upcoming session as scheduled', () => {
    expect(getDisplayStatus({ status: 'scheduled', ends_at: future }, now)).toBe('scheduled');
  });

  it.each(['completed', 'cancelled'] as const)('keeps a past %s session unchanged', (status) => {
    expect(getDisplayStatus({ status, ends_at: past }, now)).toBe(status);
  });
});
