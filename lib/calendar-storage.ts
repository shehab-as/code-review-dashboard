export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color: string;
}

const STORAGE_KEY = 'calendar_events';

export function loadEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function addEvent(event: CalendarEvent): CalendarEvent[] {
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
  return events;
}

export function removeEvent(id: string): CalendarEvent[] {
  const events = loadEvents().filter(e => e.id !== id);
  saveEvents(events);
  return events;
}
