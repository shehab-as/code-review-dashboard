import {
  CalendarEvent,
  loadEvents,
  saveEvents,
  addEvent,
  removeEvent,
} from '@/lib/calendar-storage';

// Mock localStorage
const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    },
    writable: true,
  });
});

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'evt-1',
  title: 'Team standup',
  date: '2026-02-16',
  color: 'bg-blue-500',
  ...overrides,
});

// ─── loadEvents ─────────────────────────────────────────────────────

describe('loadEvents', () => {
  it('returns empty array when nothing is stored', () => {
    expect(loadEvents()).toEqual([]);
  });

  it('returns parsed events from localStorage', () => {
    const events = [makeEvent()];
    store['calendar_events'] = JSON.stringify(events);
    expect(loadEvents()).toEqual(events);
  });

  it('returns empty array for corrupted data', () => {
    store['calendar_events'] = 'not-json{{{';
    expect(loadEvents()).toEqual([]);
  });
});

// ─── saveEvents ─────────────────────────────────────────────────────

describe('saveEvents', () => {
  it('persists events to localStorage', () => {
    const events = [makeEvent()];
    saveEvents(events);
    expect(JSON.parse(store['calendar_events'])).toEqual(events);
  });

  it('overwrites existing events', () => {
    saveEvents([makeEvent({ id: 'evt-1' })]);
    saveEvents([makeEvent({ id: 'evt-2' })]);
    const loaded = JSON.parse(store['calendar_events']);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('evt-2');
  });
});

// ─── addEvent ───────────────────────────────────────────────────────

describe('addEvent', () => {
  it('adds an event to empty storage and returns updated list', () => {
    const event = makeEvent();
    const result = addEvent(event);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(event);
  });

  it('appends to existing events', () => {
    saveEvents([makeEvent({ id: 'evt-1' })]);
    const result = addEvent(makeEvent({ id: 'evt-2', title: 'Lunch' }));
    expect(result).toHaveLength(2);
    expect(result[1].title).toBe('Lunch');
  });

  it('persists the added event', () => {
    addEvent(makeEvent());
    expect(loadEvents()).toHaveLength(1);
  });
});

// ─── removeEvent ────────────────────────────────────────────────────

describe('removeEvent', () => {
  it('removes an event by id', () => {
    saveEvents([makeEvent({ id: 'evt-1' }), makeEvent({ id: 'evt-2' })]);
    const result = removeEvent('evt-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('evt-2');
  });

  it('returns empty array when removing the last event', () => {
    saveEvents([makeEvent({ id: 'evt-1' })]);
    const result = removeEvent('evt-1');
    expect(result).toEqual([]);
  });

  it('does nothing when id does not exist', () => {
    saveEvents([makeEvent({ id: 'evt-1' })]);
    const result = removeEvent('nonexistent');
    expect(result).toHaveLength(1);
  });

  it('persists the removal', () => {
    saveEvents([makeEvent({ id: 'evt-1' })]);
    removeEvent('evt-1');
    expect(loadEvents()).toEqual([]);
  });

  it('preserves event with time field', () => {
    saveEvents([
      makeEvent({ id: 'evt-1', time: '09:00' }),
      makeEvent({ id: 'evt-2', time: '14:00' }),
    ]);
    const result = removeEvent('evt-1');
    expect(result[0].time).toBe('14:00');
  });
});
