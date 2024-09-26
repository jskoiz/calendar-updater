import ical, { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { config } from './config';
import { CalendarEvent } from './eventSchema';

export function createICalEvent(event: CalendarEvent): ICalCalendar {
  const cal = ical({
    prodId: '//Your Company//Your Product//EN',
    timezone: config.timezone,
  });

  const startTime = DateTime.fromISO(event.start).setZone(config.timezone);
  const endTime = DateTime.fromISO(event.end).setZone(config.timezone);

  cal.createEvent({
    start: startTime.toJSDate(),
    end: endTime.toJSDate(),
    summary: event.summary,
  });

  return cal;
}
