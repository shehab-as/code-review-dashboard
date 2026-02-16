'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import {
  CalendarEvent,
  loadEvents,
  addEvent,
  removeEvent,
} from '@/lib/calendar-storage';

const EVENT_COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
];

function EventModal({
  date,
  onClose,
  onSave,
}: {
  date: Date;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: crypto.randomUUID(),
      title: title.trim(),
      date: format(date, 'yyyy-MM-dd'),
      time: time || undefined,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">New Event</h3>
        <p className="text-sm text-gray-500 mb-4">{format(date, 'EEEE, MMMM d, yyyy')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Event title..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.value} transition-all ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DayEventsPanel({
  date,
  events,
  onDelete,
  onClose,
}: {
  date: Date;
  events: CalendarEvent[];
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Events</h3>
        <p className="text-sm text-gray-500 mb-4">{format(date, 'EEEE, MMMM d, yyyy')}</p>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No events for this day.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
              .map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    {event.time && <p className="text-xs text-gray-500">{event.time}</p>}
                  </div>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg"
                    title="Delete event"
                  >
                    &times;
                  </button>
                </div>
              ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventsPanel, setShowEventsPanel] = useState(false);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  const handleAddEvent = useCallback((event: CalendarEvent) => {
    const updated = addEvent(event);
    setEvents(updated);
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    const updated = removeEvent(id);
    setEvents(updated);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count events this month
  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''} this month
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            &larr;
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors mt-0.5"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            &rarr;
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 transition-colors cursor-pointer hover:bg-blue-50/50 ${
                  !inMonth ? 'bg-gray-50/50' : ''
                }`}
                onClick={() => {
                  setSelectedDate(day);
                  if (dayEvents.length > 0) {
                    setShowEventsPanel(true);
                  } else {
                    setShowAddModal(true);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      today
                        ? 'bg-blue-600 text-white'
                        : inMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && inMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                        setShowAddModal(true);
                      }}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded text-xs transition-colors"
                      title="Add event"
                    >
                      +
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`${event.color} text-white text-[10px] leading-tight px-1.5 py-0.5 rounded truncate`}
                    >
                      {event.time && <span className="opacity-75">{event.time} </span>}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add event modal */}
      {showAddModal && selectedDate && (
        <EventModal
          date={selectedDate}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDate(null);
          }}
          onSave={handleAddEvent}
        />
      )}

      {/* Day events panel */}
      {showEventsPanel && selectedDate && (
        <DayEventsPanel
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
          onDelete={handleDeleteEvent}
          onClose={() => {
            setShowEventsPanel(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
