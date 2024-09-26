import ical, { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { config } from './config';
import { CalendarEvent } from './eventSchema';

function ensureDateTime(date: string | Date): DateTime {
  return date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
}

export function createICalEvent(event: CalendarEvent): ICalCalendar {
  const cal = ical({
    prodId: '//Your Company//Your Product//EN',
    timezone: config.timezone,
  });

  const startTime = ensureDateTime(event.start).setZone(config.timezone);
  const endTime = ensureDateTime(event.end).setZone(config.timezone);

  cal.createEvent({
    start: startTime.toJSDate(),
    end: endTime.toJSDate(),
    summary: event.summary,
  });

  return cal;
}
